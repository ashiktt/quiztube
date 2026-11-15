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
    .replace(/\.{4,}/g, '...')      // normalize runaway dots
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
 * Checks whether a line represents raw Mermaid diagram code or technical labels that must not be printed.
 */
function isMermaidOrTechnicalCode(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Mermaid diagram declaration keywords
  if (/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph)\b/i.test(trimmed)) {
    return true;
  }

  // Raw diagram connector / node syntax
  if (/^([A-Za-z0-9_]+\[.+\]|-->|==>|-\.->|subgraph\b|end$)/.test(trimmed)) {
    return true;
  }

  // Labels that should never appear as standalone text
  const lower = trimmed.toLowerCase();
  if (
    lower === 'flowchart td' ||
    lower === 'flowchart lr' ||
    lower === 'graph td' ||
    lower === 'graph lr' ||
    lower.startsWith('model solution (') ||
    lower.startsWith('examiner criteria')
  ) {
    return true;
  }

  return false;
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
 * Draws a crisp vector circle bullet for list items
 */
function drawVectorBullet(doc: jsPDF, x: number, y: number, color = [71, 85, 105]): void {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.circle(x, y - 1.1, 0.7, 'F');
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
    defaultColor = [30, 41, 59], // Slate 800 for high-contrast academic readability
  } = params;

  interface StyledWord {
    word: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
  }

  const words: StyledWord[] = [];

  for (const span of spans) {
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

    if (currentLineWidth + wordWidth <= availWidth || currentLine.length === 0) {
      currentLine.push({
        text: w.word,
        bold: w.bold,
        italic: w.italic,
        code: w.code,
      });
      currentLineWidth += wordWidth;
    } else {
      wrappedLines.push(currentLine);
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

  let curY = initialY;

  wrappedLines.forEach((lineTokens, lineIdx) => {
    let curX = lineIdx === 0 ? startX : hangingIndentX;

    for (const token of lineTokens) {
      if (token.code) {
        doc.setFont('courier', 'normal');
        doc.setTextColor(30, 41, 59);
      } else if (token.bold) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42); // Slate 900 for bold emphasis
      } else if (token.italic) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(51, 65, 85);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(defaultColor[0], defaultColor[1], defaultColor[2]);
      }
      doc.setFontSize(fontSize);

      doc.text(token.text, curX, curY);
      curX += doc.getTextWidth(token.text);
    }

    curY += lineHeight;
  });

  return { newY: curY - lineHeight, linesDrawn: wrappedLines.length };
}

/**
 * Checks whether a line represents a formal academic section heading.
 * Matches:
 * - "### 1. Definition" or "## 1. Definition" or "# 1. Definition"
 * - "1. Definition" or "2. Importance of ..."
 * - "**1. Definition**"
 */
function isSectionHeading(line: string): { isHeading: boolean; headingText: string; level: number } {
  const trimmed = line.trim();

  // 1. Markdown heading hashes
  const hashMatch = trimmed.match(/^(#{1,4})\s+(.*)/);
  if (hashMatch) {
    const rawHeading = hashMatch[2].trim();
    // Ignore stray flowchart or technical headers
    if (isMermaidOrTechnicalCode(rawHeading)) {
      return { isHeading: false, headingText: '', level: 0 };
    }
    return { isHeading: true, headingText: cleanMarkdownText(rawHeading), level: hashMatch[1].length };
  }

  // 2. Bold section title e.g. "**1. Definition**" or "**1. Definition:**"
  const boldMatch = trimmed.match(/^\*\*(\d+\.\s+[^:]+):?\*\*$/);
  if (boldMatch) {
    return { isHeading: true, headingText: boldMatch[1].trim(), level: 2 };
  }

  // 3. Numbered section title e.g. "1. Definition" or "2. Importance of Distributed Object Management"
  // (Criteria: starts with digit followed by dot and space, shorter than 80 chars, no terminal period/semicolon)
  const numSecMatch = trimmed.match(/^(\d+\.\s+[A-Za-z][^.\n]{2,75})$/);
  if (numSecMatch && !trimmed.includes(':') && !trimmed.endsWith('.')) {
    return { isHeading: true, headingText: numSecMatch[1].trim(), level: 2 };
  }

  return { isHeading: false, headingText: '', level: 0 };
}

/**
 * Generates and downloads a clean, professional, publication-ready academic model solution PDF booklet.
 * Follows official university examination answer standards:
 * - Zero unnecessary headers ("MODEL SOLUTION (X MARKS)", "FLOWCHART TD", "EXAMINER CRITERIA")
 * - Answers begin immediately under the Question Title
 * - 6-section academic structure with bold terminology and numbered points
 * - High-DPI Mermaid diagrams rendered with smart pagination and captions
 * - Crisp typography, comfortable line spacing, and smart orphan prevention
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
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Dark Navy / Slate 900

  const subjectTitle = exam.subject || 'University Examination — Model Solutions';
  const titleLines = doc.splitTextToSize(cleanMarkdownText(subjectTitle), contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += titleLines.length * 7.5 + 2;

  // Metadata Subline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  const metaText = `Academic Level: ${exam.academicLevel || 'Undergraduate'}   |   Total Marks: ${exam.totalMarks || 0} Marks   |   Questions Solved: ${exam.solutions.length}`;
  doc.text(metaText, margin, yPos);
  yPos += 5.5;

  // Subtle divider under title header
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 7;

  // ==========================================
  // 2. QUESTION-BY-QUESTION SOLUTIONS
  // ==========================================
  exam.solutions.forEach((sol, idx) => {
    // Smart lookahead: ensure question header + first section fit without orphan split
    checkPageBreak(38);

    const qNum = sol.questionNumber || `Q${idx + 1}`;
    const cleanQText = cleanMarkdownText(sol.questionText);
    const marksSuffix = sol.marksAllocated ? ` (${sol.marksAllocated} Marks)` : '';

    // ==========================================
    // QUESTION TITLE (Prominent, 15.5 pt Bold)
    // Starts directly with the question title
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15.5);
    doc.setTextColor(15, 23, 42); // Dark Navy

    const fullQuestionHeading = `${qNum}. ${cleanQText}${marksSuffix}`;
    const qHeadingLines = doc.splitTextToSize(fullQuestionHeading, contentWidth);
    doc.text(qHeadingLines, margin, yPos);
    yPos += qHeadingLines.length * 6.2 + 4.5;

    // Structured Detailed Answer Rendering
    const rawLines = sol.detailedAnswer ? sol.detailedAnswer.split('\n') : [];
    let lineIdx = 0;
    let diagramDrawn = false;
    const renderedDiagram = diagramMap.get(idx);

    // Helper to render diagram cleanly
    const drawDiagramBlock = () => {
      if (diagramDrawn || !renderedDiagram || !renderedDiagram.dataUrl) return;

      const maxW = contentWidth - 4;
      const maxH = 90; // Max 90mm height to prevent page crowding
      let dWidth = Math.min(maxW, Math.max(70, 85 * renderedDiagram.aspectRatio));
      let dHeight = dWidth / renderedDiagram.aspectRatio;

      if (dHeight > maxH) {
        dHeight = maxH;
        dWidth = dHeight * renderedDiagram.aspectRatio;
      }

      const totalDiagramBlockHeight = dHeight + 14;

      // Smart pagination: ensure diagram and caption are never split across pages
      checkPageBreak(totalDiagramBlockHeight);

      // Center diagram horizontally
      const dX = margin + (contentWidth - dWidth) / 2;

      // Solid white background with subtle border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.25);
      doc.roundedRect(dX - 2, yPos, dWidth + 4, dHeight + 4, 1.0, 1.0, 'FD');

      // Embed high-resolution diagram image
      doc.addImage(renderedDiagram.dataUrl, 'PNG', dX, yPos + 2, dWidth, dHeight);
      yPos += dHeight + 6;

      // Clean, small, professional caption
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // Slate 500
      const caption = `Figure: ${qNum} Architecture & Technical Workflow`;
      doc.text(caption, pageWidth / 2, yPos, { align: 'center' });
      yPos += 6.5;

      diagramDrawn = true;
    };

    while (lineIdx < rawLines.length) {
      const line = rawLines[lineIdx].trim();

      if (!line) {
        yPos += 2.0;
        lineIdx++;
        continue;
      }

      // Skip any stray Mermaid code or technical labels that might have appeared in detailedAnswer
      if (isMermaidOrTechnicalCode(line)) {
        lineIdx++;
        continue;
      }

      // Check if we should insert the diagram before Advantages or Conclusion sections
      const headingCheck = isSectionHeading(line);
      if (headingCheck.isHeading && !diagramDrawn && renderedDiagram) {
        const hLower = headingCheck.headingText.toLowerCase();
        if (
          hLower.includes('advantage') ||
          hLower.includes('conclusion') ||
          hLower.includes('trade-off') ||
          hLower.includes('comparison') ||
          hLower.startsWith('5.') ||
          hLower.startsWith('6.')
        ) {
          drawDiagramBlock();
        }
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

      // 3. Section Headings (e.g. "1. Definition", "### 2. Importance of...", "3. Examples...")
      if (headingCheck.isHeading) {
        const cleanHeading = headingCheck.headingText;

        // Widow/orphan protection: ensure heading is kept with at least two following lines
        checkPageBreak(22);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12.5);
        doc.setTextColor(15, 23, 42); // Dark Navy / Slate 900
        doc.text(cleanHeading, margin, yPos);
        yPos += 5.5;

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

        // If fenced block is mermaid diagram, skip printing as raw code!
        const fullCodeText = codeLines.join('\n').trim();
        if (fullCodeText && !isMermaidOrTechnicalCode(fullCodeText)) {
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
          fontSize: 10.0,
          lineHeight: 5.0,
          defaultColor: [71, 85, 105],
        });

        const quoteHeight = linesDrawn * 5.0 + 2;
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

        const isIndented = rawLines[lineIdx].startsWith('  ') || rawLines[lineIdx].startsWith('\t');
        const bulletIndent = isIndented ? 7.0 : 0;
        const bulletTextX = margin + 6.0 + bulletIndent;
        const availW = contentWidth - (6.0 + bulletIndent);

        const boldLeadInMatch = rawBullet.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)/);

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
          spans = parseStyledSpans(rawBullet);
        }

        checkPageBreak(10);

        // Vector circle bullet
        drawVectorBullet(doc, margin + 2.0 + bulletIndent, yPos + 3.0, isIndented ? [100, 116, 139] : [71, 85, 105]);

        const { newY } = drawFormattedLineBlock({
          doc,
          spans,
          startX: bulletTextX,
          yPos: yPos + 3.0,
          availWidth: availW,
          fontSize: 10.5,
          lineHeight: 5.2,
          hangingIndentX: bulletTextX,
          defaultColor: [30, 41, 59],
        });

        yPos = newY + 1.8;
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

        // Check for bold lead-in: 1. **Data Sharing:** Explanation
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
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42); // Dark Navy
        doc.text(numPrefix, margin + 0.5, yPos + 3.0);

        const { newY } = drawFormattedLineBlock({
          doc,
          spans,
          startX: numTextX,
          yPos: yPos + 3.0,
          availWidth: availW,
          fontSize: 10.5,
          lineHeight: 5.2,
          hangingIndentX: numTextX,
          defaultColor: [30, 41, 59],
        });

        yPos = newY + 2.0;
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
        fontSize: 10.5,
        lineHeight: 5.2,
        hangingIndentX: margin,
        defaultColor: [30, 41, 59],
      });

      yPos = newY + 2.5;
      lineIdx++;
    }

    // If diagram was not drawn inline yet, draw it after detailed answer
    if (!diagramDrawn && renderedDiagram) {
      drawDiagramBlock();
    }

    // Formulas or Code Snippet (if present in sol.formulasOrCode)
    if (sol.formulasOrCode && sol.formulasOrCode.trim().length > 0) {
      const cleanCode = sol.formulasOrCode.replace(/^```[a-zA-Z]*\n?|```$/g, '').trim();
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      const codeLines = doc.splitTextToSize(cleanCode, contentWidth - 8);
      const boxHeight = codeLines.length * 3.8 + 6;

      checkPageBreak(Math.min(boxHeight + 8, 70));

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text('Mathematical Formulation & Code Implementation', margin, yPos);
      yPos += 4;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.0, 1.0, 'FD');

      doc.setTextColor(30, 41, 59);
      doc.text(codeLines, margin + 4, yPos + 4.5);
      yPos += boxHeight + 5;
    }

    // Subtle hairline divider between questions (except the last one)
    if (idx < exam.solutions.length - 1) {
      checkPageBreak(12);
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;
    }
  });

  // ==========================================
  // 3. ACADEMIC PAGE NUMBERING FOOTER
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
