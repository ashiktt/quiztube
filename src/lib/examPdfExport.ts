import { jsPDF } from 'jspdf';
import { UniversitySolvedExam } from '@/types';

/**
 * Strips markdown formatting symbols (**, *, `, etc.) for clean PDF rendering
 */
function cleanMarkdownText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold asterisks
    .replace(/\*(.*?)\*/g, '$1')     // remove italic asterisks
    .replace(/__(.*?)__/g, '$1')     // remove bold underscores
    .replace(/_(.*?)_/g, '$1')       // remove italic underscores
    .replace(/`([^`]+)`/g, '$1')     // remove inline code backticks
    .trim();
}

/**
 * Generates and downloads a clean, professional, publication-grade university exam model answer PDF booklet.
 * Optimized for A4 printing and high-readability mobile PDF viewing.
 */
export function exportUniversityExamPdf(exam: UniversitySolvedExam): void {
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
    doc.text(exam.subject.toUpperCase(), margin, 12);
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
  const titleLines = doc.splitTextToSize(exam.subject, contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += titleLines.length * 6 + 1;

  // Metadata Subline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate 600
  const metaText = `Level: ${exam.academicLevel}   •   Total Marks: ${exam.totalMarks}M   •   Questions: ${exam.solutions.length}`;
  doc.text(metaText, margin, yPos);
  yPos += 5;

  // Header bottom dividing line
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ==========================
  // 2. QUESTION-BY-QUESTION SOLUTIONS
  // ==========================
  exam.solutions.forEach((sol, idx) => {
    // Avoid orphan question headers near page bottom
    checkPageBreak(30);

    const qNum = sol.questionNumber || `Q${idx + 1}`;
    const marksText = `[${sol.marksAllocated} Marks]`;

    // Question Title Line (e.g. "Q1. [2 Marks]")
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text(`${qNum}  ${marksText}`, margin, yPos);
    yPos += 5.5;

    // Full Question Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // Slate 700
    const cleanQText = cleanMarkdownText(sol.questionText);
    const qLines = doc.splitTextToSize(cleanQText, contentWidth);
    doc.text(qLines, margin, yPos);
    yPos += qLines.length * 4.4 + 4;

    // Model Answer Content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59); // Slate 800

    // Parse the structured detailedAnswer lines
    const rawLines = sol.detailedAnswer.split('\n');

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) {
        yPos += 2;
        continue;
      }

      checkPageBreak(8);

      // Section Headings (### or ## or #)
      if (line.startsWith('#')) {
        const heading = cleanMarkdownText(line.replace(/^#+\s*/, ''));
        checkPageBreak(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.text(heading, margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        yPos += 4.8;
      }
      // Bullet points (- or * or •)
      else if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
        const bulletText = cleanMarkdownText(line.replace(/^[-*•]\s*/, ''));
        const bulletLines = doc.splitTextToSize(bulletText, contentWidth - 5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('•', margin + 1.5, yPos);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(bulletLines, margin + 5, yPos);
        yPos += bulletLines.length * 4.2 + 1.5;
      }
      // Numbered lists (1. 2. 3.)
      else if (/^\d+\.\s+/.test(line)) {
        const match = line.match(/^(\d+\.)\s+(.*)/);
        const numPrefix = match ? match[1] : '1.';
        const restText = match ? cleanMarkdownText(match[2]) : cleanMarkdownText(line);
        const numLines = doc.splitTextToSize(restText, contentWidth - 6);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(numPrefix, margin + 1, yPos);

        doc.setFont('helvetica', 'normal');
        doc.text(numLines, margin + 6, yPos);
        yPos += numLines.length * 4.2 + 1.5;
      }
      // Regular Paragraph text
      else {
        const cleanText = cleanMarkdownText(line);
        const pLines = doc.splitTextToSize(cleanText, contentWidth);
        doc.text(pLines, margin, yPos);
        yPos += pLines.length * 4.2 + 2;
      }
    }

    // Formulas or Code Snippet (if present)
    if (sol.formulasOrCode && sol.formulasOrCode.trim().length > 0) {
      checkPageBreak(20);
      const cleanCode = sol.formulasOrCode.replace(/^```[a-zA-Z]*\n?|```$/g, '').trim();
      const codeLines = doc.splitTextToSize(cleanCode, contentWidth - 6);
      const boxHeight = Math.min(codeLines.length * 3.6 + 5, 60);

      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.5, 1.5, 'FD');

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(codeLines.slice(0, 15), margin + 3, yPos + 4);
      yPos += boxHeight + 4;
    }

    yPos += 4;

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
  // 3. CLEAN PAGE NUMBERING FOOTER
  // ==========================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `QuizTube AI  •  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Save PDF
  const safeFilename = (exam.subject || 'University_Exam_Solutions')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
  doc.save(`${safeFilename}_Model_Answers.pdf`);
}
