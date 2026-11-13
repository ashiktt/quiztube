import { jsPDF } from 'jspdf';
import { UniversitySolvedExam, SolvedQuestionItem } from '@/types';
import { renderMermaidToPngDataUrl, RenderedDiagram } from './diagramToImage';

/**
 * Strips markdown formatting symbols (**, *, `, etc.) for plain text measuring / rendering
 */
function cleanMarkdownText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold asterisks
    .replace(/\*(.*?)\*/g, '$1')     // remove italic asterisks
    .replace(/__(.*?)__/g, '$1')     // remove bold underscores
    .replace(/_(.*?)_/g, '$1')       // remove italic underscores
    .replace(/`([^`]+)`/g, '$1')     // remove inline code backticks
    .trim();
}

/**
 * Parses markdown lines to detect and extract tables
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

  // Must have a separator line next: |---|---|
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
 * Generates and downloads a clean, professional, publication-grade university exam model answer PDF booklet.
 * Preserves the white academic design, embeds generated visual diagrams, and formats markdown structures cleanly.
 */
export async function exportUniversityExamPdf(exam: UniversitySolvedExam): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 16;
  let yPos = 18;

  // Pre-render all Mermaid diagrams to PNG images concurrently for instant embedding
  const diagramMap = new Map<number, RenderedDiagram | null>();
  const diagramPromises = exam.solutions.map(async (sol, idx) => {
    if (sol.diagramMermaid && sol.diagramMermaid.trim().length > 0) {
      try {
        const rendered = await renderMermaidToPngDataUrl(sol.diagramMermaid);
        diagramMap.set(idx, rendered);
      } catch (err) {
        console.warn(`Failed to render diagram for question ${idx + 1}:`, err);
        diagramMap.set(idx, null);
      }
    } else {
      diagramMap.set(idx, null);
    }
  });

  await Promise.all(diagramPromises);

  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      yPos = 18;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`SABERIO AI  •  ${(exam.subject || 'EXAMINATION').toUpperCase()}`, margin, 12);
    doc.text(`MODEL SOLUTIONS`, pageWidth - margin, 12, { align: 'right' });
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);
  };

  // ==========================
  // 1. ACADEMIC TITLE HEADER (First Page)
  // ==========================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // Slate 900
  const titleLines = doc.splitTextToSize(exam.subject || 'University Examination Solutions', contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += titleLines.length * 6 + 1;

  // Metadata Subline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate 600
  const metaText = `Level: ${exam.academicLevel || 'Undergraduate'}   •   Total Marks: ${exam.totalMarks || 0}M   •   Questions Solved: ${exam.solutions.length}`;
  doc.text(metaText, margin, yPos);
  yPos += 5;

  // Header bottom dividing line
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 7;

  // Overview Summary Callout (if present)
  if (exam.overallExamSummary && exam.overallExamSummary.trim().length > 0) {
    const summaryLines = doc.splitTextToSize(cleanMarkdownText(exam.overallExamSummary), contentWidth - 8);
    const boxHeight = summaryLines.length * 4 + 7;

    checkPageBreak(boxHeight + 4);

    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.5, 1.5, 'FD');

    // Left blue accent indicator
    doc.setFillColor(99, 102, 241); // Indigo 500
    doc.roundedRect(margin, yPos, 1.5, boxHeight, 0.7, 0.7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(67, 56, 202); // Indigo 700
    doc.text('EXAM PAPER SYNTHESIS & CORE SCOPE', margin + 4, yPos + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85); // Slate 700
    doc.text(summaryLines, margin + 4, yPos + 8.5);

    yPos += boxHeight + 6;
  }

  // ==========================
  // 2. QUESTION-BY-QUESTION SOLUTIONS
  // ==========================
  exam.solutions.forEach((sol, idx) => {
    // Avoid orphan question header near page bottom
    checkPageBreak(35);

    const qNum = sol.questionNumber || `Q${idx + 1}`;
    const marksText = `[${sol.marksAllocated} Marks]`;

    // Question Title Line (e.g. "Q1. [5 Marks]")
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(`${qNum}   ${marksText}`, margin, yPos);
    yPos += 5.5;

    // Full Question Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // Slate 700
    const cleanQText = cleanMarkdownText(sol.questionText);
    const qLines = doc.splitTextToSize(cleanQText, contentWidth);
    doc.text(qLines, margin, yPos);
    yPos += qLines.length * 4.4 + 3;

    // TL;DR Core Thesis (if available)
    if (sol.answerSummary && sol.answerSummary.trim().length > 0) {
      checkPageBreak(16);
      const cleanSummary = cleanMarkdownText(sol.answerSummary);
      const thesisLines = doc.splitTextToSize(`Core Thesis: ${cleanSummary}`, contentWidth - 8);
      const thesisHeight = thesisLines.length * 3.8 + 5;

      doc.setFillColor(240, 253, 244); // Emerald 50
      doc.setDrawColor(187, 247, 208); // Emerald 200
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPos, contentWidth, thesisHeight, 1.2, 1.2, 'FD');

      // Left green accent indicator
      doc.setFillColor(16, 185, 129); // Emerald 500
      doc.rect(margin, yPos, 1.2, thesisHeight, 'F');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(21, 128, 61); // Emerald 700
      doc.text(thesisLines, margin + 4, yPos + 4);

      yPos += thesisHeight + 4;
    }

    // Model Solution Section Header
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text(`MODEL SOLUTION (${sol.marksAllocated} MARKS DEPTH)`, margin, yPos);
    doc.setDrawColor(224, 231, 255); // Indigo 100
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 1.5, margin + 65, yPos + 1.5);
    yPos += 5.5;

    // Parse the structured detailedAnswer lines
    const rawLines = sol.detailedAnswer ? sol.detailedAnswer.split('\n') : [];
    let lineIdx = 0;

    while (lineIdx < rawLines.length) {
      const line = rawLines[lineIdx].trim();

      if (!line) {
        yPos += 1.8;
        lineIdx++;
        continue;
      }

      // Check for Markdown Table: | Col1 | Col2 |
      if (line.startsWith('|') && line.endsWith('|')) {
        const tableResult = parseMarkdownTable(rawLines, lineIdx);
        if (tableResult) {
          const { table, nextIndex } = tableResult;
          lineIdx = nextIndex;

          const numCols = table.headers.length;
          const colWidth = (contentWidth - 4) / Math.max(1, numCols);
          const headerHeight = 7;
          const rowHeight = 6.5;
          const totalTableHeight = headerHeight + table.rows.length * rowHeight + 3;

          checkPageBreak(Math.min(totalTableHeight, 60));

          // Draw table header row
          doc.setFillColor(241, 245, 249); // Slate 100
          doc.setDrawColor(203, 213, 225); // Slate 300
          doc.setLineWidth(0.3);
          doc.rect(margin, yPos, contentWidth, headerHeight, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42); // Slate 900

          table.headers.forEach((h, cIdx) => {
            const hX = margin + cIdx * colWidth + 2;
            doc.text(h, hX, yPos + 4.8);
          });

          yPos += headerHeight;

          // Draw table rows
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);

          table.rows.forEach((row, rIdx) => {
            checkPageBreak(rowHeight + 2);
            if (rIdx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(margin, yPos, contentWidth, rowHeight, 'F');
            }
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, yPos + rowHeight, margin + contentWidth, yPos + rowHeight);

            row.forEach((cell, cIdx) => {
              const cellX = margin + cIdx * colWidth + 2;
              const cellLines = doc.splitTextToSize(cell, colWidth - 4);
              doc.text(cellLines[0] || '', cellX, yPos + 4.5);
            });

            yPos += rowHeight;
          });

          yPos += 3;
          continue;
        }
      }

      // Section Headings (### or ## or #)
      if (/^#{1,4}\s+/.test(line)) {
        const headingText = cleanMarkdownText(line.replace(/^#{1,4}\s+/, ''));
        checkPageBreak(12);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.text(headingText, margin, yPos);

        yPos += 4.8;
        lineIdx++;
        continue;
      }

      // Fenced Code Block: ```...```
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

        const codeText = codeLines.join('\n').trim();
        if (codeText) {
          const splitCode = doc.splitTextToSize(codeText, contentWidth - 8);
          const boxHeight = Math.min(splitCode.length * 3.6 + 6, 65);

          checkPageBreak(boxHeight + 4);

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.2, 1.2, 'FD');

          doc.setFont('courier', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text(splitCode.slice(0, 16), margin + 4, yPos + 4.5);

          yPos += boxHeight + 4;
        }
        continue;
      }

      // Blockquote: > ...
      if (line.startsWith('>')) {
        const quoteText = cleanMarkdownText(line.replace(/^>\s*/, ''));
        const quoteLines = doc.splitTextToSize(quoteText, contentWidth - 8);
        const quoteHeight = quoteLines.length * 4 + 3;

        checkPageBreak(quoteHeight + 2);

        doc.setDrawColor(99, 102, 241); // Indigo
        doc.setLineWidth(0.8);
        doc.line(margin + 1, yPos, margin + 1, yPos + quoteHeight - 1);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(quoteLines, margin + 5, yPos + 3.5);

        yPos += quoteHeight + 2;
        lineIdx++;
        continue;
      }

      // Bullet points (- or * or •)
      if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
        const rawBullet = line.replace(/^[-*•]\s*/, '').trim();

        // Check if bullet starts with bold header: - **Title:** Description
        const boldMatch = rawBullet.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)/);

        if (boldMatch) {
          const boldTitle = boldMatch[1].trim() + (boldMatch[0].includes(':') ? ':' : '');
          const restText = cleanMarkdownText(boldMatch[2].trim());

          const combinedText = boldTitle ? `${boldTitle} ${restText}` : restText;
          const bulletLines = doc.splitTextToSize(combinedText, contentWidth - 7);

          checkPageBreak(bulletLines.length * 4.2 + 2);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(79, 70, 229); // Indigo bullet
          doc.text('•', margin + 1.5, yPos);

          // If single line or short, we can emphasize the title
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42); // Slate 900
          doc.text(boldTitle, margin + 6, yPos);

          const titleWidth = doc.getTextWidth(boldTitle);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);

          // If fits on one line with title
          if (bulletLines.length === 1) {
            doc.text(` ${restText}`, margin + 6 + titleWidth, yPos);
            yPos += 4.5;
          } else {
            // Re-wrap body lines after title or render cleanly
            const bodyLines = doc.splitTextToSize(restText, contentWidth - 7);
            doc.text(bodyLines[0], margin + 6 + titleWidth + 1.5, yPos);
            yPos += 4.2;

            for (let b = 1; b < bodyLines.length; b++) {
              doc.text(bodyLines[b], margin + 6, yPos);
              yPos += 4.2;
            }
            yPos += 1;
          }
        } else {
          const bulletText = cleanMarkdownText(rawBullet);
          const bulletLines = doc.splitTextToSize(bulletText, contentWidth - 7);

          checkPageBreak(bulletLines.length * 4.2 + 2);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(99, 102, 241);
          doc.text('•', margin + 1.5, yPos);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(bulletLines, margin + 6, yPos);
          yPos += bulletLines.length * 4.2 + 1.5;
        }

        lineIdx++;
        continue;
      }

      // Numbered lists (1. 2. 3.)
      if (/^\d+\.\s+/.test(line)) {
        const match = line.match(/^(\d+\.)\s+(.*)/);
        const numPrefix = match ? match[1] : '1.';
        const rawContent = match ? match[2] : line;

        // Check for bold title in numbered item: 1. **Title:** text
        const boldMatch = rawContent.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)/);
        const title = boldMatch ? boldMatch[1].trim() + ':' : '';
        const rest = boldMatch ? boldMatch[2].trim() : rawContent;
        const fullClean = title ? `${title} ${cleanMarkdownText(rest)}` : cleanMarkdownText(rest);

        const numLines = doc.splitTextToSize(fullClean, contentWidth - 8);

        checkPageBreak(numLines.length * 4.2 + 2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(numPrefix, margin + 1, yPos);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(numLines, margin + 7, yPos);
        yPos += numLines.length * 4.2 + 1.5;

        lineIdx++;
        continue;
      }

      // Regular Paragraph text
      const cleanText = cleanMarkdownText(line);
      const pLines = doc.splitTextToSize(cleanText, contentWidth);
      checkPageBreak(pLines.length * 4.2 + 2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(pLines, margin, yPos);
      yPos += pLines.length * 4.2 + 2.5;

      lineIdx++;
    }

    // ==========================================
    // 3. VISUAL ARCHITECTURE / FLOWCHART DIAGRAM
    // ==========================================
    const renderedDiagram = diagramMap.get(idx);
    if (renderedDiagram && renderedDiagram.dataUrl) {
      // Calculate diagram dimensions preserving aspect ratio
      const maxW = contentWidth - 4;
      const maxH = 100; // max 100mm height
      let dWidth = Math.min(maxW, Math.max(65, 80 * renderedDiagram.aspectRatio));
      let dHeight = dWidth / renderedDiagram.aspectRatio;

      if (dHeight > maxH) {
        dHeight = maxH;
        dWidth = dHeight * renderedDiagram.aspectRatio;
      }

      const totalDiagramBlockHeight = dHeight + 14;

      // Smart pagination: ensure the diagram and its caption are never split across pages
      checkPageBreak(totalDiagramBlockHeight);

      // Center diagram horizontally
      const dX = margin + (contentWidth - dWidth) / 2;

      // Subtle container frame
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.3);
      doc.roundedRect(dX - 2, yPos, dWidth + 4, dHeight + 4, 1.5, 1.5, 'FD');

      // Embed high-resolution diagram image
      doc.addImage(renderedDiagram.dataUrl, 'PNG', dX, yPos + 2, dWidth, dHeight);
      yPos += dHeight + 7;

      // Diagram figure caption
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // Slate 600
      const caption = `Figure: ${qNum} System Architecture & Visual Flowchart`;
      doc.text(caption, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5.5;
    }

    // ==========================================
    // 4. FORMULAS OR CODE SNIPPET (if present)
    // ==========================================
    if (sol.formulasOrCode && sol.formulasOrCode.trim().length > 0) {
      const cleanCode = sol.formulasOrCode.replace(/^```[a-zA-Z]*\n?|```$/g, '').trim();
      const codeLines = doc.splitTextToSize(cleanCode, contentWidth - 8);
      const boxHeight = Math.min(codeLines.length * 3.6 + 6, 60);

      checkPageBreak(boxHeight + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(107, 33, 168); // Purple 800
      doc.text('CORE FORMULATION & SYNTAX IMPLEMENTATION', margin, yPos);
      yPos += 3.5;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.2, 1.2, 'FD');

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(codeLines.slice(0, 16), margin + 4, yPos + 4.5);
      yPos += boxHeight + 4.5;
    }

    // ==========================================
    // 5. EXAMINER CRITERIA / CHECKLIST (Full Marks)
    // ==========================================
    if (sol.keyPoints && sol.keyPoints.length > 0) {
      checkPageBreak(sol.keyPoints.length * 4.2 + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text('EXAMINER CRITERIA (CHECKLIST FOR FULL MARKS):', margin, yPos);
      yPos += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      sol.keyPoints.forEach(kp => {
        const cleanKp = cleanMarkdownText(kp);
        const kpLines = doc.splitTextToSize(cleanKp, contentWidth - 8);

        checkPageBreak(kpLines.length * 4 + 1.5);

        doc.setTextColor(16, 185, 129); // Emerald checkmark
        doc.setFont('helvetica', 'bold');
        doc.text('✓', margin + 1.5, yPos);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(kpLines, margin + 6, yPos);
        yPos += kpLines.length * 4 + 1.5;
      });

      yPos += 2;
    }

    // Clean divider between questions (except the last one)
    if (idx < exam.solutions.length - 1) {
      checkPageBreak(12);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;
    }
  });

  // ==========================
  // 6. ACADEMIC PAGE NUMBERING FOOTER
  // ==========================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `Saberio AI  •  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Save PDF with sanitized academic file name
  const safeSubject = (exam.subject || 'University_Exam_Solutions')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
  doc.save(`Saberio_AI_${safeSubject}_Model_Answers.pdf`);
}
