import { jsPDF } from 'jspdf';
import { UniversitySolvedExam, SolvedQuestionItem } from '@/types';
import { renderMermaidToPngDataUrl, RenderedDiagram } from './diagramToImage';
import {
  drawPdfFirstPageHeader,
  finalizePdfLayout,
  resetPdfTypographyState,
  cleanMarkdownText,
  splitIntoSegments,
  measureTextWithSymbols,
  splitTextWithSymbolsToSize,
} from './pdfBranding';

export { cleanMarkdownText };

export interface StyledSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

/**
 * Parses inline markdown styled spans (bold, italic, code) for legacy text inspection and compatibility.
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
    } else if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      spans.push({ text: part.slice(2, -2), bold: true });
    } else if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
      spans.push({ text: part.slice(2, -2), bold: true });
    } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      spans.push({ text: part.slice(1, -1), italic: true });
    } else if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
      spans.push({ text: part.slice(1, -1), italic: true });
    } else {
      spans.push({ text: part });
    }
  }

  return spans;
}

/**
 * Checks whether a line contains raw Mermaid diagram syntax or technical labels that must never be printed as text.
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

  // Unwanted technical formatting labels
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
 * Checks whether a line represents a formal academic section heading.
 * Matches:
 * - "### 1. Definition" or "## 1. Definition" or "# 1. Definition"
 * - "1. Definition" or "2. Importance of ..."
 * - "**1. Definition**" or "**1. Definition:**"
 */
function parseSectionHeading(line: string): { isHeading: boolean; headingText: string } {
  const trimmed = line.trim();

  // 1. Markdown heading hashes
  const hashMatch = trimmed.match(/^(#{1,4})\s+(.*)/);
  if (hashMatch) {
    const rawHeading = hashMatch[2].trim();
    if (isMermaidOrTechnicalCode(rawHeading)) {
      return { isHeading: false, headingText: '' };
    }
    return { isHeading: true, headingText: cleanMarkdownText(rawHeading) };
  }

  // 2. Bold section title e.g. "**1. Definition**" or "**1. Definition:**"
  const boldMatch = trimmed.match(/^\*\*(\d+\.\s+[^:]+):?\*\*$/);
  if (boldMatch) {
    return { isHeading: true, headingText: boldMatch[1].trim() };
  }

  // 3. Numbered section title e.g. "1. Definition" or "2. Importance of Distributed Object Management"
  const numSecMatch = trimmed.match(/^(\d+\.\s+[A-Za-z][^.\n]{2,75})$/);
  if (numSecMatch && !trimmed.includes(':') && !trimmed.endsWith('.')) {
    return { isHeading: true, headingText: numSecMatch[1].trim() };
  }

  return { isHeading: false, headingText: '' };
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
 * Draws a sharp vector circle bullet (100% PDF encoding safe, no Unicode glyph corruption)
 */
function drawVectorBullet(doc: jsPDF, x: number, y: number, color = [71, 85, 105]): void {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.circle(x, y - 1.1, 0.7, 'F');
}

/**
 * Renders a single line of text supporting inline mathematical and Greek symbols
 * rendered with standard PostScript Symbol font (/F14) without any UTF-16 character corruption.
 */
export function renderSegmentedLine(
  doc: jsPDF,
  lineText: string,
  x: number,
  y: number,
  isBold = false,
  color: [number, number, number] = [30, 41, 59],
  fontSize = 10.5
): number {
  if (!lineText) return 0;
  const segments = splitIntoSegments(lineText);
  let curX = x;

  for (const seg of segments) {
    if (seg.isSymbol) {
      doc.setFont('Symbol', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(seg.symbolCode, curX, y);
      curX += doc.getTextWidth(seg.symbolCode);
    } else {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(seg.text, curX, y);
      curX += doc.getTextWidth(seg.text);
    }
  }

  // Restore font
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  return curX - x;
}

/**
 * Renders an academic list item (numbered or bulleted) with a bold title and natural body text.
 * Renders lines as complete continuous strings to guarantee 100% natural character-spacing
 * and eliminate disjoint word-spacing and character collision artifacts.
 */
function renderAcademicListItem(params: {
  doc: jsPDF;
  prefix: string; // e.g. "1." or "•"
  boldTitle?: string; // e.g. "Data Sharing:"
  bodyText: string;
  startX: number;
  yPos: number;
  contentWidth: number;
  fontSize?: number;
  lineHeight?: number;
  hangingIndentX?: number;
  itemSpacing?: number;
  isBullet?: boolean;
}): { newY: number; linesCount: number } {
  const {
    doc,
    prefix,
    boldTitle = '',
    bodyText,
    startX,
    yPos: initialY,
    contentWidth,
    fontSize = 10.5,
    lineHeight = 5.4,
    hangingIndentX = startX + 7.5,
    itemSpacing = 2.8,
    isBullet = false,
  } = params;

  let curY = initialY;
  let linesDrawn = 1;

  // 1. Draw bullet symbol or numbered prefix
  if (isBullet) {
    drawVectorBullet(doc, startX + 2.0, curY, [71, 85, 105]);
  } else {
    renderSegmentedLine(doc, prefix, startX, curY, true, [15, 23, 42], fontSize);
  }

  const prefixTextX = hangingIndentX;
  const availWidth = contentWidth - (hangingIndentX - startX);

  if (boldTitle) {
    // Measure bold title width taking mathematical symbols into account
    const titleWidth = measureTextWithSymbols(doc, boldTitle + ' ', true);

    // Check if remaining body text fits on the first line
    const firstLineAvailWidth = availWidth - titleWidth;

    if (firstLineAvailWidth > 25 && bodyText.trim().length > 0) {
      // Split body text into words to fit first line
      const words = bodyText.trim().split(/\s+/);
      let line1Words: string[] = [];
      let restWords: string[] = [];
      let curW = 0;

      for (let i = 0; i < words.length; i++) {
        const wWidth = measureTextWithSymbols(doc, words[i] + ' ', false);
        if (curW + wWidth <= firstLineAvailWidth) {
          line1Words.push(words[i]);
          curW += wWidth;
        } else {
          restWords = words.slice(i);
          break;
        }
      }

      // Render bold title
      renderSegmentedLine(doc, boldTitle, prefixTextX, curY, true, [15, 23, 42], fontSize);

      // Render first line body text as a segmented line with authentic symbols
      if (line1Words.length > 0) {
        renderSegmentedLine(doc, line1Words.join(' '), prefixTextX + titleWidth, curY, false, [30, 41, 59], fontSize);
      }

      // Render subsequent lines with full hanging indent as complete continuous strings
      if (restWords.length > 0) {
        const remainingStr = restWords.join(' ');
        const wrappedLines = splitTextWithSymbolsToSize(doc, remainingStr, availWidth, false);
        for (let j = 0; j < wrappedLines.length; j++) {
          curY += lineHeight;
          renderSegmentedLine(doc, wrappedLines[j], prefixTextX, curY, false, [30, 41, 59], fontSize);
          linesDrawn++;
        }
      }
    } else {
      // Bold title occupies entire first line
      renderSegmentedLine(doc, boldTitle, prefixTextX, curY, true, [15, 23, 42], fontSize);

      if (bodyText.trim().length > 0) {
        const wrappedLines = splitTextWithSymbolsToSize(doc, bodyText.trim(), availWidth, false);
        for (let j = 0; j < wrappedLines.length; j++) {
          curY += lineHeight;
          renderSegmentedLine(doc, wrappedLines[j], prefixTextX, curY, false, [30, 41, 59], fontSize);
          linesDrawn++;
        }
      }
    }
  } else {
    // Pure text item (no bold sub-heading)
    const wrappedLines = splitTextWithSymbolsToSize(doc, bodyText.trim(), availWidth, false);
    wrappedLines.forEach((wLine: string, idx: number) => {
      renderSegmentedLine(doc, wLine, prefixTextX, initialY + idx * lineHeight, false, [30, 41, 59], fontSize);
    });
    linesDrawn = Math.max(1, wrappedLines.length);
    curY = initialY + (linesDrawn - 1) * lineHeight;
  }

  // nextY is the starting baseline for the NEXT item or element:
  const nextY = curY + lineHeight + itemSpacing;

  resetPdfTypographyState(doc);
  return { newY: nextY, linesCount: linesDrawn };
}

/**
 * Renders a full academic paragraph with 100% natural character spacing,
 * native PDF font kerning, comfortable line-height, and authentic symbol rendering.
 * Supports bold lead-ins (e.g. **Alphabet (Σ):** or **Example:**).
 */
function renderParagraph(
  doc: jsPDF,
  text: string,
  startX: number,
  yPos: number,
  availWidth: number,
  fontSize = 10.5,
  lineHeight = 5.4,
  paragraphSpacing = 3.2
): { newY: number; linesCount: number } {
  const trimmed = text.trim();
  if (!trimmed) return { newY: yPos, linesCount: 0 };

  // Check for bold lead-in e.g. **Alphabet (Σ):** or **Example:** or **Concept**:
  const boldLeadMatch = trimmed.match(/^\*\*([^*]+)\*\*[:\s-]*([\s\S]*)/);

  if (boldLeadMatch) {
    const rawT = boldLeadMatch[1].trim();
    const cleanT = cleanMarkdownText(rawT);
    const boldTitle = cleanT.endsWith(':') ? cleanT : `${cleanT}:`;
    const restText = cleanMarkdownText(boldLeadMatch[2].trim().replace(/^:+/, '').trim());

    if (!restText) {
      // Bold title standalone on its line (e.g. **Example:**)
      renderSegmentedLine(doc, boldTitle, startX, yPos, true, [15, 23, 42], fontSize);
      const nextY = yPos + lineHeight + 1.8;
      resetPdfTypographyState(doc);
      return { newY: nextY, linesCount: 1 };
    }

    // Bold title followed by body text on the same line
    const titleWidth = measureTextWithSymbols(doc, boldTitle + ' ', true);
    const firstLineAvail = availWidth - titleWidth;

    if (firstLineAvail > 20) {
      const words = restText.split(/\s+/);
      let line1Words: string[] = [];
      let restWords: string[] = [];
      let curW = 0;

      for (let i = 0; i < words.length; i++) {
        const wW = measureTextWithSymbols(doc, words[i] + ' ', false);
        if (curW + wW <= firstLineAvail) {
          line1Words.push(words[i]);
          curW += wW;
        } else {
          restWords = words.slice(i);
          break;
        }
      }

      renderSegmentedLine(doc, boldTitle, startX, yPos, true, [15, 23, 42], fontSize);
      if (line1Words.length > 0) {
        renderSegmentedLine(doc, line1Words.join(' '), startX + titleWidth, yPos, false, [30, 41, 59], fontSize);
      }

      let curY = yPos;
      let linesCount = 1;

      if (restWords.length > 0) {
        const wrapped = splitTextWithSymbolsToSize(doc, restWords.join(' '), availWidth, false);
        for (let j = 0; j < wrapped.length; j++) {
          curY += lineHeight;
          renderSegmentedLine(doc, wrapped[j], startX, curY, false, [30, 41, 59], fontSize);
          linesCount++;
        }
      }

      const nextY = curY + lineHeight + paragraphSpacing;
      resetPdfTypographyState(doc);
      return { newY: nextY, linesCount };
    }
  }

  // Standard paragraph without bold lead-in
  const clean = cleanMarkdownText(text);
  if (!clean) return { newY: yPos, linesCount: 0 };

  const lines = splitTextWithSymbolsToSize(doc, clean, availWidth, false);
  let curY = yPos;
  lines.forEach((line, idx) => {
    const lineY = yPos + idx * lineHeight;
    renderSegmentedLine(doc, line, startX, lineY, false, [30, 41, 59], fontSize);
    curY = lineY;
  });

  const nextY = curY + lineHeight + paragraphSpacing;
  resetPdfTypographyState(doc);
  return { newY: nextY, linesCount: lines.length };
}

/**
 * Generates and downloads a publication-quality academic model solution PDF booklet.
 * - Official Saberio AI Logo and Brand Header on First Page
 * - Safe, non-colliding running headers on subsequent pages
 * - Natural character spacing without artificial word compression
 * - Question titles (17.5 pt bold), Section headings (13 pt bold), Body (11 pt normal)
 * - Zero unnecessary labels ("MODEL SOLUTION", "FLOWCHART TD", "EXAMINER CRITERIA")
 * - High-DPI Mermaid diagrams centered with captions and smart pagination
 * - Academic running footers ("Saberio AI • Study Smarter | Page X of Y")
 */
export async function exportUniversityExamPdf(exam: UniversitySolvedExam): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 18; // Consistent 18mm margin
  const contentWidth = pageWidth - margin * 2; // 174 mm
  const bottomMargin = 18;

  // Pre-render all Mermaid diagrams to high-DPI PNGs asynchronously
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
  let yPos = 18;
  const checkPageBreak = (neededHeight: number): boolean => {
    if (yPos + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      yPos = 20; // Top position on new pages after running header
      return true;
    }
    return false;
  };

  // ==========================================
  // 1. OFFICIAL BRANDED FIRST-PAGE HEADER
  // ==========================================
  yPos = drawPdfFirstPageHeader(doc, {
    subject: exam.subject,
    documentTitle: 'UNIVERSITY MODEL SOLUTIONS',
    academicLevel: exam.academicLevel,
    totalMarks: exam.totalMarks,
    itemCount: exam.solutions.length,
    itemCountLabel: 'Questions Solved',
    margin,
    pageWidth,
  });

  // Overview Summary Callout (if present)
  if (exam.overallExamSummary && exam.overallExamSummary.trim().length > 0) {
    const cleanSummary = cleanMarkdownText(exam.overallExamSummary);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const summaryLines = doc.splitTextToSize(cleanSummary, contentWidth - 8);
    const boxHeight = summaryLines.length * 4.6 + 8;

    checkPageBreak(boxHeight + 5);

    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.2, 1.2, 'FD');

    // Subtle blue accent line
    doc.setFillColor(37, 99, 235); // Blue 600
    doc.rect(margin, yPos, 1.0, boxHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 64, 175); // Blue 800
    doc.text('EXAMINATION OVERVIEW & SCOPE', margin + 4, yPos + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(summaryLines, margin + 4, yPos + 9.5);

    yPos += boxHeight + 7;
    resetPdfTypographyState(doc);
  }

  // ==========================================
  // 2. QUESTION-BY-QUESTION SOLUTIONS
  // ==========================================
  exam.solutions.forEach((sol, idx) => {
    // Prevent question header from appearing alone at page bottom
    checkPageBreak(38);

    const qNum = sol.questionNumber || `Q${idx + 1}`;
    const cleanQText = cleanMarkdownText(sol.questionText);
    const marksSuffix = sol.marksAllocated ? ` (${sol.marksAllocated} Marks)` : '';

    // Question Title (17.5 pt Bold Dark Navy)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17.5);
    doc.setTextColor(15, 23, 42); // Dark Navy

    const fullQuestionHeading = `${qNum}. ${cleanQText}${marksSuffix}`;
    const qHeadingLines = splitTextWithSymbolsToSize(doc, fullQuestionHeading, contentWidth, true);
    qHeadingLines.forEach((qLine, qIdx) => {
      renderSegmentedLine(doc, qLine, margin, yPos + qIdx * 7.0, true, [15, 23, 42], 17.5);
    });
    yPos += qHeadingLines.length * 7.0 + 5.0;

    // Structured Detailed Answer Rendering
    const rawLines = sol.detailedAnswer ? sol.detailedAnswer.split('\n') : [];
    let lineIdx = 0;
    let diagramDrawn = false;
    const renderedDiagram = diagramMap.get(idx);

    // Helper to render diagram cleanly
    const drawDiagramBlock = () => {
      if (diagramDrawn || !renderedDiagram || !renderedDiagram.dataUrl) return;

      const maxW = contentWidth - 4;
      const maxH = 92; // Max 92mm height
      let dWidth = Math.min(maxW, Math.max(70, 85 * renderedDiagram.aspectRatio));
      let dHeight = dWidth / renderedDiagram.aspectRatio;

      if (dHeight > maxH) {
        dHeight = maxH;
        dWidth = dHeight * renderedDiagram.aspectRatio;
      }

      const totalDiagramBlockHeight = dHeight + 14;

      // Smart pagination: prevent diagram and caption from splitting
      checkPageBreak(totalDiagramBlockHeight);

      const dX = margin + (contentWidth - dWidth) / 2;

      // Crisp white canvas frame
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.25);
      doc.roundedRect(dX - 2, yPos, dWidth + 4, dHeight + 4, 1.0, 1.0, 'FD');

      // Embed high-resolution diagram
      doc.addImage(renderedDiagram.dataUrl, 'PNG', dX, yPos + 2, dWidth, dHeight);
      yPos += dHeight + 6;

      // Caption
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // Slate 500
      const caption = `Figure: ${qNum} Architecture & Technical Workflow`;
      doc.text(caption, pageWidth / 2, yPos, { align: 'center' });
      yPos += 7.0;

      diagramDrawn = true;
      resetPdfTypographyState(doc);
    };

    while (lineIdx < rawLines.length) {
      const line = rawLines[lineIdx].trim();

      if (!line) {
        yPos += 2.2;
        lineIdx++;
        continue;
      }

      // Skip any stray Mermaid code or technical labels that might have appeared in detailedAnswer
      if (isMermaidOrTechnicalCode(line)) {
        lineIdx++;
        continue;
      }

      // Check for section heading
      const headingCheck = parseSectionHeading(line);

      // If heading is Advantages or Conclusion, insert diagram right before it
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
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, yPos + 1.5, margin + contentWidth, yPos + 1.5);
        yPos += 5.5;
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

          yPos += 4.5;
          resetPdfTypographyState(doc);
          continue;
        }
      }

      // 3. Section Headings (e.g. "1. Definition", "2. Importance of...", "3. Examples...")
      if (headingCheck.isHeading) {
        const cleanHeading = headingCheck.headingText;

        // Widow/orphan protection: ensure heading is kept with following content
        checkPageBreak(25);

        renderSegmentedLine(doc, cleanHeading, margin, yPos, true, [15, 23, 42], 12.5);
        yPos += 7.0;

        resetPdfTypographyState(doc);
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
        if (fullCodeText && !isMermaidOrTechnicalCode(fullCodeText)) {
          doc.setFont('courier', 'normal');
          doc.setFontSize(8.5);
          const splitCode = doc.splitTextToSize(fullCodeText, contentWidth - 8);
          const boxHeight = splitCode.length * 3.8 + 6;

          checkPageBreak(Math.min(boxHeight + 4, 70));

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.25);
          doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.0, 1.0, 'FD');

          doc.setTextColor(30, 41, 59);
          doc.text(splitCode, margin + 4, yPos + 4.5);

          yPos += boxHeight + 5.0;
          resetPdfTypographyState(doc);
        }
        continue;
      }

      // 5. Blockquote: > ...
      if (line.startsWith('>')) {
        const quoteText = cleanMarkdownText(line.replace(/^>\s*/, ''));
        checkPageBreak(12);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10.5);
        doc.setTextColor(71, 85, 105);

        const quoteLines = doc.splitTextToSize(quoteText, contentWidth - 10);
        const quoteHeight = quoteLines.length * 5.2 + 2;

        doc.setDrawColor(37, 99, 235); // Blue 600
        doc.setLineWidth(0.7);
        doc.line(margin + 1, yPos, margin + 1, yPos + quoteHeight);

        doc.text(quoteLines, margin + 6, yPos + 3.5);
        yPos += quoteHeight + 3.0;

        resetPdfTypographyState(doc);
        lineIdx++;
        continue;
      }

      // 6. Bullet Point (- or * or • followed by whitespace, NOT bold text starting with **)
      const isBulletLine = /^([-•]|\*(?!\*))\s+/.test(line);
      if (isBulletLine) {
        const rawBullet = line.replace(/^([-•]|\*(?!\*))\s*/, '').trim();
        const boldMatch = rawBullet.match(/^\*\*([^*]+)\*\*[:\s-]*([\s\S]*)/);
        const colonMatch = !boldMatch ? rawBullet.match(/^([A-Za-z0-9\s/&-]{3,45}):\s+(.*)/) : null;

        let boldTitle = '';
        let restText = rawBullet;

        if (boldMatch) {
          const rawT = boldMatch[1].trim();
          boldTitle = rawT.endsWith(':') ? rawT : `${rawT}:`;
          restText = boldMatch[2].trim().replace(/^:+/, '').trim();
        } else if (colonMatch) {
          boldTitle = colonMatch[1].trim() + ':';
          restText = colonMatch[2].trim();
        }

        checkPageBreak(12);

        const { newY } = renderAcademicListItem({
          doc,
          prefix: '•',
          boldTitle: boldTitle ? cleanMarkdownText(boldTitle) : undefined,
          bodyText: cleanMarkdownText(restText),
          startX: margin,
          yPos,
          contentWidth,
          fontSize: 10.5,
          lineHeight: 5.4,
          hangingIndentX: margin + 6.0,
          itemSpacing: 2.8,
          isBullet: true,
        });

        yPos = newY;
        lineIdx++;
        continue;
      }

      // 7. Numbered List Item: 1. 2. 3.
      const numMatch = line.match(/^(\d+\.)\s+(.*)/);
      if (numMatch) {
        const numPrefix = numMatch[1];
        const rawContent = numMatch[2].trim();
        const boldMatch = rawContent.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)/);
        const colonMatch = !boldMatch ? rawContent.match(/^([A-Za-z0-9\s/&-]{3,45}):\s+(.*)/) : null;

        let boldTitle = '';
        let restText = rawContent;

        if (boldMatch) {
          const rawT = boldMatch[1].trim();
          boldTitle = rawT.endsWith(':') ? rawT : `${rawT}:`;
          restText = boldMatch[2].trim().replace(/^:+/, '').trim();
        } else if (colonMatch) {
          boldTitle = colonMatch[1].trim() + ':';
          restText = colonMatch[2].trim();
        }

        checkPageBreak(12);

        const { newY } = renderAcademicListItem({
          doc,
          prefix: numPrefix,
          boldTitle: boldTitle ? cleanMarkdownText(boldTitle) : undefined,
          bodyText: cleanMarkdownText(restText),
          startX: margin,
          yPos,
          contentWidth,
          fontSize: 10.5,
          lineHeight: 5.4,
          hangingIndentX: margin + 7.5,
          itemSpacing: 2.8,
          isBullet: false,
        });

        yPos = newY;
        lineIdx++;
        continue;
      }

      // 8. Regular Formatted Paragraph (Native single-string rendering for 100% natural kerning)
      checkPageBreak(12);
      const { newY } = renderParagraph(doc, line, margin, yPos, contentWidth, 10.5, 5.4, 3.2);
      yPos = newY;
      lineIdx++;
    }

    // If diagram was not drawn inline yet, draw it after the detailed answer
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
      resetPdfTypographyState(doc);
    }

    // Subtle hairline divider between questions (except the last one)
    if (idx < exam.solutions.length - 1) {
      checkPageBreak(14);
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;
    }
  });

  // ==========================================
  // 3. FINALIZE MULTI-PAGE LAYOUT (Running Headers & Footers)
  // ==========================================
  finalizePdfLayout(doc, {
    subject: exam.subject || 'UNIVERSITY EXAMINATION',
    rightHeaderLabel: 'SABERIO AI  •  MODEL SOLUTIONS',
    margin,
  });

  // Save PDF with clean academic filename
  const safeSubject = (exam.subject || 'University_Exam_Solutions')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
  doc.save(`Saberio_AI_${safeSubject}_Model_Answers.pdf`);
}
