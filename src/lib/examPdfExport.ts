import { jsPDF } from 'jspdf';
import { UniversitySolvedExam } from '@/types';

/**
 * Generates and downloads a clean, professional university-grade model answer PDF booklet
 */
export function exportUniversityExamPdf(exam: UniversitySolvedExam): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - 18) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Header Bar
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('QUIZTUBE AI • UNIVERSITY EXAMINATION MODEL SOLUTIONS BOOKLET', margin, 8);

  yPos = 22;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate 900
  const titleLines = doc.splitTextToSize(exam.subject.toUpperCase(), contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += titleLines.length * 6 + 2;

  // Metadata sub-bar
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Academic Level: ${exam.academicLevel}  |  Total Marks: ${exam.totalMarks}M  |  Questions: ${exam.solutions.length}`,
    margin,
    yPos
  );
  yPos += 7;

  // Student Info Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'FD');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Candidate Name: _______________________    Date: ____________    Evaluator: ___________________',
    margin + 4,
    yPos + 7.5
  );
  yPos += 18;

  // Overall Paper Summary
  if (exam.overallExamSummary) {
    checkPageBreak(25);
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('EXAM OVERVIEW & TOPICAL SCOPE:', margin + 3, yPos + 5.5);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const summaryLines = doc.splitTextToSize(exam.overallExamSummary, contentWidth - 6);
    doc.text(summaryLines, margin + 3, yPos + 10.5);
    yPos += 24;
  }

  // Iterate over each solved question
  exam.solutions.forEach((sol, idx) => {
    checkPageBreak(40);

    // Question Box Header
    doc.setDrawColor(99, 102, 241); // Indigo border
    doc.setFillColor(238, 242, 255); // Indigo 50 background
    doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(67, 56, 202); // Indigo 700
    const qHeader = `${sol.questionNumber || `Q${idx + 1}`}: [${sol.marksAllocated} MARKS]`;
    doc.text(qHeader, margin + 3, yPos + 6.5);

    // Right-aligned mark badge
    doc.setFontSize(9);
    doc.setTextColor(99, 102, 241);
    doc.text(`Estimated: ~${sol.estimatedWordCount || '150'} words`, pageWidth - margin - 3, yPos + 6.5, {
      align: 'right',
    });

    yPos += 13;

    // Full Question Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const qTextLines = doc.splitTextToSize(`Question: ${sol.questionText}`, contentWidth);
    doc.text(qTextLines, margin, yPos);
    yPos += qTextLines.length * 4.5 + 4;

    // Core Answer Summary
    if (sol.answerSummary) {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text('Key Thesis / TL;DR Answer:', margin, yPos);
      yPos += 4.5;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const ansSummLines = doc.splitTextToSize(sol.answerSummary, contentWidth);
      doc.text(ansSummLines, margin, yPos);
      yPos += ansSummLines.length * 4 + 4;
    }

    // Detailed Model Answer
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Comprehensive Model Answer:', margin, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    // Format markdown headings in detailedAnswer
    const rawParagraphs = sol.detailedAnswer.split('\n');
    for (const line of rawParagraphs) {
      const trimmed = line.trim();
      if (!trimmed) {
        yPos += 2;
        continue;
      }

      checkPageBreak(8);

      if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
        const headingText = trimmed.replace(/^#+\s*/, '');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(67, 56, 202);
        doc.text(headingText, margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        yPos += 5;
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
        const bulletText = trimmed.replace(/^[-*•]\s*/, '');
        const bulletLines = doc.splitTextToSize(`• ${bulletText}`, contentWidth - 4);
        doc.text(bulletLines, margin + 3, yPos);
        yPos += bulletLines.length * 4 + 1.5;
      } else {
        const pLines = doc.splitTextToSize(trimmed, contentWidth);
        doc.text(pLines, margin, yPos);
        yPos += pLines.length * 4 + 2;
      }
    }
    yPos += 3;

    // Formulas or Code Snippet
    if (sol.formulasOrCode && sol.formulasOrCode.trim().length > 0) {
      checkPageBreak(25);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);

      const codeLines = doc.splitTextToSize(sol.formulasOrCode, contentWidth - 8);
      const boxHeight = Math.min(codeLines.length * 3.8 + 6, 70);

      doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.5, 1.5, 'FD');
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(codeLines.slice(0, 16), margin + 4, yPos + 4.5);
      yPos += boxHeight + 4;
    }

    // High-Yield Key Points
    if (sol.keyPoints && sol.keyPoints.length > 0) {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Key Criteria for Full Marks (Examiner Checklist):', margin, yPos);
      yPos += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      sol.keyPoints.forEach(kp => {
        checkPageBreak(6);
        const kpLines = doc.splitTextToSize(`✓ ${kp}`, contentWidth - 5);
        doc.text(kpLines, margin + 3, yPos);
        yPos += kpLines.length * 3.8 + 1;
      });
      yPos += 3;
    }

    // Examiner Tip Callout
    if (sol.examTips) {
      checkPageBreak(16);
      doc.setFillColor(254, 243, 199); // Amber 100
      doc.setDrawColor(245, 158, 11);
      const tipLines = doc.splitTextToSize(`Examiner Tip: ${sol.examTips}`, contentWidth - 6);
      const tipHeight = tipLines.length * 3.8 + 5;
      doc.roundedRect(margin, yPos, contentWidth, tipHeight, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(146, 64, 14); // Amber 800
      doc.text(tipLines, margin + 3, yPos + 4);
      yPos += tipHeight + 6;
    }

    // Divider between questions
    checkPageBreak(10);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  });

  // Add Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `QuizTube AI  •  ${exam.subject}  •  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Download PDF
  const safeFilename = (exam.subject || 'University_Exam_Solutions')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
  doc.save(`${safeFilename}_Model_Solutions.pdf`);
}
