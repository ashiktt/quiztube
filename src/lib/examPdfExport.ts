import { jsPDF } from 'jspdf';
import { UniversitySolvedExam, SolvedQuestionItem } from '@/types';
import { renderMermaidToPngDataUrl, RenderedDiagram } from './diagramToImage';

/**
 * Cleanly strips markdown syntax for plain text measuring / fallback scenarios,
 * while strictly preserving legitimate mathematical symbols, punctuation, and wording.
 */
export function cleanMarkdownText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '') // remove leading markdown heading hashes
    .replace(/\s+#+$/gm, '')     // remove trailing heading hashes
    .replace(/\*\*([^*]+)\*\*/g, '$1') // remove bold asterisks
    .replace(/__([^_]+)__/g, '$1')     // remove bold underscores
    .replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1$2$3') // remove italic asterisks safely
    .replace(/(^|[^_])_([^_]+)_([^_]|$)/g, '$1$2$3')       // remove italic underscores safely
    .replace(/`([^`]+)`/g, '$1')     // remove inline code backticks
    .replace(/^>\s*/gm, '')          // remove blockquote markers
    .replace(/::+/g, ':')           // eliminate duplicate colons (e.g. "::")
    .trim();
}

/**
 * Inline text segment with font style metadata for academic rendering
 */
export interface StyledSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

/**
 * Parses a single text line into styled spans (bold, italic, inline code, normal text)
 * and deduplicates stray punctuation artifacts.
 */
export function parseStyledSpans(lineText: string): StyledSpan[] {
  if (!lineText) return [];

  // Match bold (**...** or __...__), italic (*...* or _..._), or inline code (`...`)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;
  const parts = lineText.split(regex);
  const spans: StyledSpan[] = [];

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      spans.push({ text: part.slice(1, -1), code: true });
    } else if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2).trim();
      if (inner) spans.push({ text: inner, bold: true });
    } else if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1).trim();
      if (inner) spans.push({ text: inner, italic: true });
    } else {
      spans.push({ text: part });
    }
  }

  // Deduplicate punctuation artifacts (e.g., if span[0] ends with ':' and span[1] starts with ':')
  for (let i = 0; i < spans.length - 1; i++) {
    const curr = spans[i];
    const next = spans[i + 1];

    if (curr.text.endsWith(':') && next.text.trimStart().startsWith(':')) {
      next.text = next.text.trimStart().replace(/^:+/, '').trimStart();
    }
  }

  return spans.filter(s => s.text.length > 0);
}

/**
 * Parses markdown table structure: | Header 1 | Header 2 |
 */
interface ParsedTable {
  headers: string[];
  rows: string[][];
}

function parseMarkdownTable(lines: string[], startIndex: number): { table: ParsedTable; nextIndex: number } | null {
  const firstLine = lines[startIndex]?.trim();
  if (!firstLine || !firstLine.startsWith('|') || !firstLine.endsWith('|')) {
    return null;
  }

  const separatorLine = lines[startIndex + 1]?.trim();
  if (!separatorLine || !separatorLine.startsWith('|') || !separatorLine.includes('---')) {
    return null;
  }

  const parseCells = (line: string): string[] => {
    return line
      .split('|')
      .slice(1, -1)
      .map(cell => cleanMarkdownText(cell.trim()));
  };

  const headers = parseCells(firstLine);
  if (headers.length === 0) return null;

  const rows: string[][] = [];
  let curr = startIndex + 2;

  while (curr < lines.length) {
    const rowLine = lines[curr]?.trim();
    if (!rowLine || !rowLine.startsWith('|') || !rowLine.endsWith('|')) {
      break;
    }
    const cells = parseCells(rowLine);
    if (cells.length > 0) {
      rows.push(cells);
    }
    curr++;
  }

  return {
    table: { headers, rows },
    nextIndex: curr,
  };
}

/**
 * Draws a sharp vector circle bullet (100% vector safe, no unsupported Unicode glyphs)
 */
function drawVectorBullet(doc: jsPDF, x: number, y: number, color = [71, 85, 105]): void {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.circle(x, y - 1.1, 0.7, 'F');
}

/**
 * Draws a sharp vector checkmark (100% vector safe, no WinAnsiEncoding corruption)
 */
function drawVectorCheckmark(doc: jsPDF, x: number, y: number, color = [16, 185, 129]): void {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.35);
  doc.line(x, y - 0.7, x + 0.9, y + 0.6);
  doc.line(x + 0.9, y + 0.6, x + 2.4, y - 1.6);
}

/**
 * Renders formatted multi-span text with exact word-wrapping, hanging indents, and zero margin overflow.
 */
function drawFormattedLineBlock(params: {
  doc: jsPDF;
  spans: StyledSpan[];
  startX: number;
  yPos: number;
  availWidth: number;
  fontSize: number;
  lineHeight: number;
  hangingIndentX?: number;
  defaultColor?: number[];
}): { newY: number; linesDrawn: number } {
  const {
    doc,
    spans,
    startX,
    yPos: initialY,
    availWidth,
    fontSize,
    lineHeight,
    hangingIndentX = startX,
    defaultColor = [51, 65, 85],
  } = params;

  // Flatten spans into individual styled words with spacing
  interface StyledWord {
    word: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
  }

  const words: StyledWord[] = [];

  for (const span of spans) {
    // Split by whitespace while preserving punctuation
    const tokens = span.text.split(/(\s+)/);
    for (const token of tokens) {
      if (!token) continue;
      words.push({
        word: token,
        bold: span.bold,
        italic: span.italic,
        code: span.code,
      });
    }
  }

  if (words.length === 0) {
    return { newY: initialY, linesDrawn: 0 };
  }

  // Group words into lines that strictly never exceed availWidth
  interface LineToken {
    text: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
  }

  const wrappedLines: LineToken[][] = [];
  let currentLine: LineToken[] = [];
  let currentLineWidth = 0;

  for (const w of words) {
    if (w.code) {
      doc.setFont('courier', 'normal');
    } else if (w.bold) {
      doc.setFont('helvetica', 'bold');
    } else if (w.italic) {
      doc.setFont('helvetica', 'italic');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    doc.setFontSize(fontSize);

    const wordWidth = doc.getTextWidth(w.word);

    // If word fits on current line, or line is empty, add it
    if (currentLineWidth + wordWidth <= availWidth || currentLine.length === 0) {
      currentLine.push({
        text: w.word,
        bold: w.bold,
        italic: w.italic,
        code: w.code,
      });
      currentLineWidth += wordWidth;
    } else {
      // Line is full; push and start next line
      wrappedLines.push(currentLine);
      // If current word is pure whitespace, don't start the new line with whitespace
      if (/^\s+$/.test(w.word)) {
        currentLine = [];
        currentLineWidth = 0;
      } else {
        currentLine = [{
          text: w.word,
          bold: w.bold,
          italic: w.italic,
          code: w.code,
        }];
        currentLineWidth = wordWidth;
      }
    }
  }

  if (currentLine.length > 0) {
    wrappedLines.push(currentLine);
  }

  // Draw the wrapped lines
  let curY = initialY;
  for (let lIdx = 0; lIdx < wrappedLines.length; lIdx++) {
    const lineTokens = wrappedLines[lIdx];
    let curX = lIdx === 0 ? startX : hangingIndentX;

    for (const token of lineTokens) {
      if (token.code) {
        doc.setFont('courier', 'normal');
        doc.setTextColor(30, 41, 59);
      } else if (token.bold) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42); // Navy 900
      } else if (token.italic) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(71, 85, 105);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(defaultColor[0], defaultColor[1], defaultColor[2]);
      }
      doc.setFontSize(fontSize);

      doc.text(token.text, curX, curY);
      curX += doc.getTextWidth(token.text);
    }

    curY += lineHeight;
  }

  return { newY: curY, linesDrawn: wrappedLines.length };
}

/**
 * Generates and downloads a clean, professional, publication-ready academic model solution PDF booklet.
 *
 * Design Specifications:
 * - Clean white background (#ffffff) with dark navy (#0f172a) and slate typography (#334155).
 * - Subtle blue accent (#2563eb) for question markers and badges.
 * - Accurate word wrapping with zero text margin overflow.
 * - Zero stray ellipses, zero duplicated punctuation, zero raw markdown syntax.
 * - Pre-rendered high-DPI Mermaid diagrams centered on page without page-splitting.
 * - Vector bullets and checkmarks (100% PDF encoding safe).
 * - Running headers (Subject | SABERIO AI — MODEL SOLUTIONS) and footers (Saberio AI | Page X of Y).
 */
export async function exportUniversityExamPdf(exam: UniversitySolvedExam): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 18; // Consistent academic 18mm margin
  const contentWidth = pageWidth - margin * 2; // 174 mm
  const topMargin = 18;
  const bottomMargin = 18;
  let yPos = topMargin;

  // Pre-render all Mermaid diagrams to PNG data URLs asynchronously
  const diagramMap = new Map<number, RenderedDiagram | null>();
  const diagramPromises = exam.solutions.map(async (sol, idx) => {
    if (sol.diagramMermaid && sol.diagramMermaid.trim().length > 0) {
      try {
        const rendered = await renderMermaidToPngDataUrl(sol.diagramMermaid);
        diagramMap.set(idx, rendered);
      } catch (err) {
        console.warn(`Diagram render error for question ${idx + 1}:`, err);
        diagramMap.set(idx, null);
      }
    } else {
      diagramMap.set(idx, null);
    }
  });

  await Promise.all(diagramPromises);

  // Smart page break helper
  const checkPageBreak = (neededHeight: number): boolean => {
    if (yPos + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      yPos = topMargin;
      drawRunningHeader();
      return true;
    }
    return false;
  };

  // Subtle academic running header
  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // Slate 400

    const rawSubject = (exam.subject || 'UNIVERSITY EXAMINATION').toUpperCase();
    const cleanSubject = rawSubject.length > 50 ? `${rawSubject.slice(0, 47)}...` : rawSubject;

    doc.text(cleanSubject, margin, 12);
    doc.text('SABERIO AI  •  MODEL SOLUTIONS', pageWidth - margin, 12, { align: 'right' });

    // Subtle hairline
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.15);
    doc.line(margin, 14, pageWidth - margin, 14);
  };

  // ==========================================
  // 1. PUBLICATION TITLE HEADER (First Page)
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(15, 23, 42); // Slate 900 / Dark Navy

  const subjectTitle = exam.subject || 'University Examination Solutions';
  const titleLines = doc.splitTextToSize(cleanMarkdownText(subjectTitle), contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += titleLines.length * 7.5 + 2;

  // Metadata Subline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  const metaText = `Academic Level: ${exam.academicLevel || 'Undergraduate'}   |   Total Marks: ${exam.totalMarks || 0}M   |   Questions Solved: ${exam.solutions.length}`;
  doc.text(metaText, margin, yPos);
  yPos += 5.5;

  // Subtle divider under title header
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 7;

  // Overview Summary Callout (if present)
  if (exam.overallExamSummary && exam.overallExamSummary.trim().length > 0) {
    const cleanSummary = cleanMarkdownText(exam.overallExamSummary);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const summaryLines = doc.splitTextToSize(cleanSummary, contentWidth - 8);
    const boxHeight = summaryLines.length * 4.3 + 8;

    checkPageBreak(boxHeight + 4);

    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.2, 1.2, 'FD');

    // Subtle blue left accent
    doc.setFillColor(37, 99, 235); // Blue 600
    doc.rect(margin, yPos, 1.0, boxHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 64, 175); // Blue 800
    doc.text('EXAMINATION OVERVIEW & SCOPE', margin + 4, yPos + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(summaryLines, margin + 4, yPos + 9.2);

    yPos += boxHeight + 6;
  }

  // ==========================================
  // 2. QUESTION-BY-QUESTION SOLUTIONS
  // ==========================================
  exam.solutions.forEach((sol, idx) => {
    // Smart lookahead: ensure question header + question text + section start fit without orphan split
    checkPageBreak(38);

    const qNum = sol.questionNumber || `Q${idx + 1}`;
    const marksText = `[${sol.marksAllocated} MARKS]`;

    // Question Number & Marks Heading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(qNum, margin, yPos);

    const qNumWidth = doc.getTextWidth(qNum);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(37, 99, 235); // Blue 600
    doc.text(marksText, margin + qNumWidth + 3, yPos - 0.5);

    yPos += 6;

    // Full Question Text in bold academic slate
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59); // Slate 800
    const cleanQText = cleanMarkdownText(sol.questionText);
    const qLines = doc.splitTextToSize(cleanQText, contentWidth);
    doc.text(qLines, margin, yPos);
    yPos += qLines.length * 5.0 + 3.5;

    // Core Thesis Callout (only when present)
    if (sol.answerSummary && sol.answerSummary.trim().length > 0) {
      const cleanSummary = cleanMarkdownText(sol.answerSummary);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const thesisLines = doc.splitTextToSize(cleanSummary, contentWidth - 8);
      const thesisHeight = thesisLines.length * 4.2 + 7.5;

      checkPageBreak(thesisHeight + 4);

      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.25);
      doc.roundedRect(margin, yPos, contentWidth, thesisHeight, 1.0, 1.0, 'FD');

      // Subtle blue vertical accent
      doc.setFillColor(37, 99, 235); // Blue 600
      doc.rect(margin, yPos, 0.9, thesisHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(37, 99, 235);
      doc.text('CORE THESIS:', margin + 4, yPos + 4.5);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(thesisLines, margin + 4, yPos + 8.8);

      yPos += thesisHeight + 5;
    }

    // Model Answer Section Heading (Clean, no decorative underlines)
    checkPageBreak(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(`MODEL SOLUTION (${sol.marksAllocated} MARKS DEPTH)`, margin, yPos);
    yPos += 5.5;

    // Structured Detailed Answer Rendering
    const rawLines = sol.detailedAnswer ? sol.detailedAnswer.split('\n') : [];
    let lineIdx = 0;

    while (lineIdx < rawLines.length) {
      const line = rawLines[lineIdx].trim();

      if (!line) {
        yPos += 2.2;
        lineIdx++;
        continue;
      }

      // 1. Markdown Separator (--- or *** or ___)
      if (/^([-*_]){3,}$/.test(line)) {
        checkPageBreak(8);
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setLineWidth(0.2);
        doc.line(margin, yPos + 1.5, margin + contentWidth, yPos + 1.5);
        yPos += 5;
        lineIdx++;
        continue;
      }

      // 2. Markdown Table: | Col1 | Col2 |
      if (line.startsWith('|') && line.endsWith('|')) {
        const tableResult = parseMarkdownTable(rawLines, lineIdx);
        if (tableResult) {
          const { table, nextIndex } = tableResult;
          lineIdx = nextIndex;

          const numCols = Math.max(1, table.headers.length);
          const colWidth = contentWidth / numCols;
          const headerHeight = 7.5;

          checkPageBreak(headerHeight + 12);

          // Table Header Row
          doc.setFillColor(241, 245, 249); // Slate 100
          doc.setDrawColor(203, 213, 225); // Slate 300
          doc.setLineWidth(0.25);
          doc.rect(margin, yPos, contentWidth, headerHeight, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);

          table.headers.forEach((h, cIdx) => {
            const hX = margin + cIdx * colWidth + 2.5;
            doc.text(h, hX, yPos + 5.0);
          });

          yPos += headerHeight;

          // Table Rows
          table.rows.forEach((row, rIdx) => {
            // Measure row height based on longest cell text
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);

            let maxCellLines = 1;
            const splitCells = row.map(cell => {
              const lines = doc.splitTextToSize(cell, colWidth - 5);
              if (lines.length > maxCellLines) maxCellLines = lines.length;
              return lines;
            });

            const rowHeight = Math.max(6.5, maxCellLines * 4.2 + 3);

            checkPageBreak(rowHeight + 2);

            if (rIdx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(margin, yPos, contentWidth, rowHeight, 'F');
            }

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.2);
            doc.line(margin, yPos + rowHeight, margin + contentWidth, yPos + rowHeight);

            doc.setTextColor(51, 65, 85);
            splitCells.forEach((cellLines, cIdx) => {
              const cellX = margin + cIdx * colWidth + 2.5;
              doc.text(cellLines, cellX, yPos + 4.5);
            });

            yPos += rowHeight;
          });

          yPos += 4;
          continue;
        }
      }

      // 3. Section Headings (H1, H2, H3, H4)
      const headingMatch = line.match(/^(#{1,4})\s+(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const cleanHeading = cleanMarkdownText(headingMatch[2]);

        // Widow/orphan protection: ensure heading is kept with at least two following lines
        checkPageBreak(16);

        if (level === 1) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(15, 23, 42);
          doc.text(cleanHeading, margin, yPos);
          yPos += 6;
        } else if (level === 2) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11.5);
          doc.setTextColor(15, 23, 42);
          doc.text(cleanHeading, margin, yPos);
          yPos += 5.5;
        } else if (level === 3) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(30, 41, 59);
          doc.text(cleanHeading, margin, yPos);
          yPos += 5.0;
        } else {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(cleanHeading, margin, yPos);
          yPos += 4.5;
        }

        lineIdx++;
        continue;
      }

      // 4. Fenced Code Blocks: ```...```
      if (line.startsWith('```')) {
        let codeLines: string[] = [];
        lineIdx++;
        while (lineIdx < rawLines.length && !rawLines[lineIdx].trim().startsWith('```')) {
          codeLines.push(rawLines[lineIdx]);
          lineIdx++;
        }
        if (lineIdx < rawLines.length && rawLines[lineIdx].trim().startsWith('```')) {
          lineIdx++;
        }

        const fullCodeText = codeLines.join('\n').trim();
        if (fullCodeText) {
          doc.setFont('courier', 'normal');
          doc.setFontSize(8.5);
          const splitCode = doc.splitTextToSize(fullCodeText, contentWidth - 8);
          const boxHeight = splitCode.length * 3.8 + 6;

          checkPageBreak(Math.min(boxHeight + 4, 70));

          doc.setFillColor(248, 250, 252); // Slate 50
          doc.setDrawColor(226, 232, 240); // Slate 200
          doc.setLineWidth(0.25);
          doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.0, 1.0, 'FD');

          doc.setTextColor(30, 41, 59);
          doc.text(splitCode, margin + 4, yPos + 4.5);

          yPos += boxHeight + 4.5;
        }
        continue;
      }

      // 5. Blockquote: > ...
      if (line.startsWith('>')) {
        const quoteText = cleanMarkdownText(line.replace(/^>\s*/, ''));
        const spans = parseStyledSpans(quoteText);

        checkPageBreak(12);

        const quoteX = margin + 5;
        const availW = contentWidth - 8;

        const { newY, linesDrawn } = drawFormattedLineBlock({
          doc,
          spans,
          startX: quoteX,
          yPos: yPos + 1.5,
          availWidth: availW,
          fontSize: 9.5,
          lineHeight: 4.8,
          defaultColor: [71, 85, 105],
        });

        const quoteHeight = linesDrawn * 4.8 + 2;
        doc.setDrawColor(37, 99, 235); // Blue 600
        doc.setLineWidth(0.7);
        doc.line(margin + 1, yPos, margin + 1, yPos + quoteHeight);

        yPos = newY + 2.5;
        lineIdx++;
        continue;
      }

      // 6. Bullet Point (- or * or •)
      if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
        const rawBullet = line.replace(/^[-*•]\s*/, '').trim();

        // Check for nested indentation (e.g. 2 spaces or 4 spaces)
        const isIndented = rawLines[lineIdx].startsWith('  ') || rawLines[lineIdx].startsWith('\t');
        const bulletIndent = isIndented ? 7.0 : 0;
        const bulletTextX = margin + 6.0 + bulletIndent;
        const availW = contentWidth - (6.0 + bulletIndent);

        // Check if bullet starts with bold lead-in: - **Title:** Description
        const boldLeadInMatch = rawBullet.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)/);

        let spans: StyledSpan[] = [];
        if (boldLeadInMatch) {
          const rawTitle = boldLeadInMatch[1].trim();
          // Normalize colon: exactly one colon at the end of the bold title
          const titleText = rawTitle.endsWith(':') ? rawTitle : `${rawTitle}:`;
          const rawRest = boldLeadInMatch[2].trim().replace(/^:+/, '').trim();

          spans = [
            { text: titleText, bold: true },
            { text: ' ' },
            ...parseStyledSpans(rawRest),
          ];
        } else {
          spans = parseStyledSpans(rawBullet);
        }

        checkPageBreak(10);

        // Draw crisp vector circle bullet
        drawVectorBullet(doc, margin + 2.0 + bulletIndent, yPos + 3.0, isIndented ? [100, 116, 139] : [71, 85, 105]);

        const { newY } = drawFormattedLineBlock({
          doc,
          spans,
          startX: bulletTextX,
          yPos: yPos + 3.0,
          availWidth: availW,
          fontSize: 10.0,
          lineHeight: 5.0,
          hangingIndentX: bulletTextX,
          defaultColor: [51, 65, 85],
        });

        yPos = newY + 1.2;
        lineIdx++;
        continue;
      }

      // 7. Numbered List Item: 1. 2. 3.
      const numMatch = line.match(/^(\d+\.)\s+(.*)/);
      if (numMatch) {
        const numPrefix = numMatch[1];
        const rawContent = numMatch[2].trim();

        const numTextX = margin + 7.5;
        const availW = contentWidth - 7.5;

        // Check if numbered item starts with bold lead-in: 1. **Title:** text
        const boldLeadInMatch = rawContent.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)/);

        let spans: StyledSpan[] = [];
        if (boldLeadInMatch) {
          const rawTitle = boldLeadInMatch[1].trim();
          const titleText = rawTitle.endsWith(':') ? rawTitle : `${rawTitle}:`;
          const rawRest = boldLeadInMatch[2].trim().replace(/^:+/, '').trim();

          spans = [
            { text: titleText, bold: true },
            { text: ' ' },
            ...parseStyledSpans(rawRest),
          ];
        } else {
          spans = parseStyledSpans(rawContent);
        }

        checkPageBreak(10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.0);
        doc.setTextColor(15, 23, 42);
        doc.text(numPrefix, margin + 0.5, yPos + 3.0);

        const { newY } = drawFormattedLineBlock({
          doc,
          spans,
          startX: numTextX,
          yPos: yPos + 3.0,
          availWidth: availW,
          fontSize: 10.0,
          lineHeight: 5.0,
          hangingIndentX: numTextX,
          defaultColor: [51, 65, 85],
        });

        yPos = newY + 1.2;
        lineIdx++;
        continue;
      }

      // 8. Regular Formatted Paragraph
      const spans = parseStyledSpans(line);
      checkPageBreak(8);

      const { newY } = drawFormattedLineBlock({
        doc,
        spans,
        startX: margin,
        yPos: yPos + 3.0,
        availWidth: contentWidth,
        fontSize: 10.0,
        lineHeight: 5.0,
        hangingIndentX: margin,
        defaultColor: [51, 65, 85],
      });

      yPos = newY + 2.0;
      lineIdx++;
    }

    // ==========================================
    // 3. VISUAL ARCHITECTURE / FLOWCHART DIAGRAM
    // ==========================================
    const renderedDiagram = diagramMap.get(idx);
    if (renderedDiagram && renderedDiagram.dataUrl) {
      const maxW = contentWidth - 4;
      const maxH = 95; // Max 95mm height to prevent page crowding
      let dWidth = Math.min(maxW, Math.max(65, 80 * renderedDiagram.aspectRatio));
      let dHeight = dWidth / renderedDiagram.aspectRatio;

      if (dHeight > maxH) {
        dHeight = maxH;
        dWidth = dHeight * renderedDiagram.aspectRatio;
      }

      const totalDiagramBlockHeight = dHeight + 14;

      // Smart pagination: ensure diagram and its caption are never split across pages
      checkPageBreak(totalDiagramBlockHeight);

      // Center diagram horizontally
      const dX = margin + (contentWidth - dWidth) / 2;

      // Subtle white canvas frame without heavy decorative borders
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.25);
      doc.roundedRect(dX - 2, yPos, dWidth + 4, dHeight + 4, 1.0, 1.0, 'FD');

      // Embed high-resolution diagram image
      doc.addImage(renderedDiagram.dataUrl, 'PNG', dX, yPos + 2, dWidth, dHeight);
      yPos += dHeight + 7;

      // Diagram figure caption (clean academic styling)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // Slate 500
      const caption = `Figure: ${qNum} System Architecture & Visual Flowchart`;
      doc.text(caption, pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
    }

    // ==========================================
    // 4. FORMULAS OR CODE SNIPPET (if present)
    // ==========================================
    if (sol.formulasOrCode && sol.formulasOrCode.trim().length > 0) {
      const cleanCode = sol.formulasOrCode.replace(/^```[a-zA-Z]*\n?|```$/g, '').trim();
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      const codeLines = doc.splitTextToSize(cleanCode, contentWidth - 8);
      const boxHeight = codeLines.length * 3.8 + 6;

      checkPageBreak(Math.min(boxHeight + 8, 70));

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('CORE FORMULATION & SYNTAX IMPLEMENTATION', margin, yPos);
      yPos += 4;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.0, 1.0, 'FD');

      doc.setTextColor(30, 41, 59);
      doc.text(codeLines, margin + 4, yPos + 4.5);
      yPos += boxHeight + 5;
    }

    // ==========================================
    // 5. EXAMINER CRITERIA / CHECKLIST (Full Marks)
    // ==========================================
    if (sol.keyPoints && sol.keyPoints.length > 0) {
      checkPageBreak(sol.keyPoints.length * 4.5 + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text('EXAMINER CRITERIA (CHECKLIST FOR FULL MARKS):', margin, yPos);
      yPos += 4.5;

      sol.keyPoints.forEach(kp => {
        const cleanKp = cleanMarkdownText(kp);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const kpLines = doc.splitTextToSize(cleanKp, contentWidth - 8);

        checkPageBreak(kpLines.length * 4.3 + 2);

        // Sharp vector checkmark
        drawVectorCheckmark(doc, margin + 1.5, yPos + 2.2);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(kpLines, margin + 6.5, yPos + 2.5);
        yPos += kpLines.length * 4.3 + 1.8;
      });

      yPos += 2;
    }

    // Clean, subtle hairline divider between questions (except the last one)
    if (idx < exam.solutions.length - 1) {
      checkPageBreak(12);
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;
    }
  });

  // ==========================================
  // 6. ACADEMIC PAGE NUMBERING FOOTER
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle header on pages after the first
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      const rawSubject = (exam.subject || 'UNIVERSITY EXAMINATION').toUpperCase();
      const cleanSubject = rawSubject.length > 45 ? `${rawSubject.slice(0, 42)}...` : rawSubject;
      doc.text(cleanSubject, margin, 12);
      doc.text('SABERIO AI  •  MODEL SOLUTIONS', pageWidth - margin, 12, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.15);
      doc.line(margin, 14, pageWidth - margin, 14);
    }

    // Footer on every page
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('Saberio AI', margin, pageHeight - 10);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Save PDF with clean academic filename
  const safeSubject = (exam.subject || 'University_Exam_Solutions')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
  doc.save(`Saberio_AI_${safeSubject}_Model_Answers.pdf`);
}
