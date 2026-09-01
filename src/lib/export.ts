import { jsPDF } from 'jspdf';
import { LectureStudySet } from '@/types';

/**
 * Generates and downloads a student-friendly printable PDF quiz with:
 * - Cover / Header info with video banner
 * - Visual Cheatsheet summary with Core Formulas & Comparison Matrix
 * - Clean Question test sheet with option checkboxes
 * - Separated Answer Key & Explanations on the final page
 */
export function exportQuizToPdf(studySet: LectureStudySet): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > 275) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('LECTURE STUDY SET & ASSESSMENT', margin, yPos);
  yPos += 8;

  // Lecture Details
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  const titleLines = doc.splitTextToSize(`Topic: ${studySet.videoTitle}`, contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += titleLines.length * 5 + 3;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Source: ${studySet.channelTitle} | Questions: ${studySet.questions.length} | Difficulty: ${studySet.difficulty.toUpperCase()}`, margin, yPos);
  yPos += 6;

  // Student Info Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.text('Student Name: _______________________    Date: ____________    Score: _______ / ' + studySet.questions.length, margin + 4, yPos + 8);
  yPos += 18;

  // SECTION: CHEATSHEET & FORMULAS (if available)
  if (studySet.cheatsheet?.coreFormulas && studySet.cheatsheet.coreFormulas.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text('HIGH-YIELD CHEATSHEET & FORMULAS', margin, yPos);
    yPos += 7;

    studySet.cheatsheet.coreFormulas.forEach((item, fIdx) => {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(`• ${item.label}:`, margin, yPos);
      yPos += 4.5;

      doc.setFont('courier', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(67, 56, 202);
      doc.text(`   ${item.formula}`, margin, yPos);
      yPos += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const expLines = doc.splitTextToSize(`   ${item.explanation}`, contentWidth - 5);
      doc.text(expLines, margin, yPos);
      yPos += expLines.length * 3.8 + 2;
    });

    yPos += 4;
  }

  // Questions Section
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('PART I: PRACTICE QUESTIONS', margin, yPos);
  yPos += 6;

  studySet.questions.forEach((q, idx) => {
    checkPageBreak(35);

    // Question Box / Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    const qHeader = `Q${idx + 1}. [${q.topicTag || 'General'}] (${q.difficulty.toUpperCase()})`;
    doc.text(qHeader, margin, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const qTextLines = doc.splitTextToSize(q.question, contentWidth);
    doc.text(qTextLines, margin, yPos);
    yPos += qTextLines.length * 4.5 + 2;

    // Options
    const optLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    q.options.forEach((opt, optIdx) => {
      checkPageBreak(10);
      const optLabel = optLabels[optIdx] || `${optIdx + 1}`;
      doc.setDrawColor(148, 163, 184);
      doc.circle(margin + 3, yPos - 1.2, 1.8, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const optTextLines = doc.splitTextToSize(`${optLabel}) ${opt}`, contentWidth - 10);
      doc.text(optTextLines, margin + 8, yPos);
      yPos += optTextLines.length * 4.5 + 1;
    });

    yPos += 4;
  });

  // Answer Key Page
  doc.addPage();
  yPos = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('PART II: ANSWER KEY & DETAILED EXPLANATIONS', margin, yPos);
  yPos += 10;

  studySet.questions.forEach((q, idx) => {
    checkPageBreak(40);

    const optLabels = ['A', 'B', 'C', 'D'];
    const correctLetter = optLabels[q.correctIndex] || `Option ${q.correctIndex + 1}`;
    const correctText = q.options[q.correctIndex] || '';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(16, 185, 129); // Emerald green
    doc.text(`Q${idx + 1} Correct Answer: ${correctLetter} - ${correctText}`, margin, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Lecture Timestamp: ${q.timestampFormatted} | Bloom's Level: ${q.bloomsLevel || 'Understanding'}`, margin, yPos);
    yPos += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const expLines = doc.splitTextToSize(`Explanation: ${q.explanation}`, contentWidth);
    doc.text(expLines, margin, yPos);
    yPos += expLines.length * 4 + 5;
  });

  // Download PDF
  const safeFilename = (studySet.videoTitle || 'Lecture_Quiz')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
  doc.save(`${safeFilename}_StudySet.pdf`);
}

/**
 * Export Flashcards in standard CSV/TSV format compatible with Anki, Quizlet, and Notion
 */
export function exportFlashcardsToAnki(studySet: LectureStudySet): void {
  const headers = ['Front', 'Back', 'Key Takeaway', 'Timestamp', 'Topic'];
  const rows = studySet.flashcards.map(f => [
    `"${f.front.replace(/"/g, '""')}"`,
    `"${f.back.replace(/"/g, '""')}"`,
    `"${(f.keyTakeaway || '').replace(/"/g, '""')}"`,
    `"${f.timestampFormatted || ''}"`,
    `"${(f.topicTag || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeFilename = (studySet.videoTitle || 'Flashcards')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
  link.setAttribute('download', `${safeFilename}_Anki_Deck.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export full Markdown Study Guide / Cheatsheet
 */
export function exportStudyGuideToMarkdown(studySet: LectureStudySet): void {
  const optLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  let md = `# Visual Study Cheatsheet: ${studySet.videoTitle}\n\n`;
  md += `**Channel / Instructor:** ${studySet.channelTitle}\n`;
  md += `**Video URL:** ${studySet.videoUrl || 'N/A'}\n`;
  md += `**Thumbnail / Banner:** ![](${studySet.cheatsheet?.heroImageUrl || studySet.thumbnailUrl})\n`;
  md += `**Generated:** ${new Date(studySet.createdAt).toLocaleDateString()}\n\n`;
  md += `---\n\n`;

  // Cheatsheet Section
  if (studySet.cheatsheet) {
    md += `## ⚡ High-Yield Cheatsheet & Core Formulas\n\n`;
    if (studySet.cheatsheet.coreFormulas) {
      studySet.cheatsheet.coreFormulas.forEach(f => {
        md += `### ${f.label}\n`;
        md += `\`\`\`\n${f.formula}\n\`\`\`\n`;
        md += `*${f.explanation}*\n\n`;
      });
    }

    if (studySet.cheatsheet.flowchart) {
      md += `### 🔄 Visual Architecture Flowchart\n\n`;
      md += `\`\`\`mermaid\n${studySet.cheatsheet.flowchart.mermaidCode}\n\`\`\`\n\n`;
      if (studySet.cheatsheet.flowchart.description) {
        md += `*${studySet.cheatsheet.flowchart.description}*\n\n`;
      }
    }

    if (studySet.cheatsheet.comparisonTable) {
      md += `### 📊 Comparison Matrix\n\n`;
      md += `| ${studySet.cheatsheet.comparisonTable.headers.join(' | ')} |\n`;
      md += `| ${studySet.cheatsheet.comparisonTable.headers.map(() => '---').join(' | ')} |\n`;
      studySet.cheatsheet.comparisonTable.rows.forEach(r => {
        md += `| ${r.join(' | ')} |\n`;
      });
      md += `\n`;
    }

    if (studySet.cheatsheet.pitfalls) {
      md += `### ⚠️ Common Exam Pitfalls & Misconceptions\n\n`;
      studySet.cheatsheet.pitfalls.forEach(p => {
        md += `- ❌ **Misconception:** ${p.misconception}\n`;
        md += `  - ✅ **Correct Fact:** ${p.correctFact}\n`;
        md += `  - 💡 *Why:* ${p.whyItMatters}\n\n`;
      });
    }

    md += `---\n\n`;
  }

  md += `## 📖 Lecture Overview & Summary\n\n`;
  md += `${studySet.overallSummary}\n\n`;

  md += `### 💡 High-Yield Key Takeaways\n\n`;
  studySet.keyTakeaways.forEach(t => {
    md += `- ${t}\n`;
  });
  md += `\n`;

  if (studySet.chapters && studySet.chapters.length > 0) {
    md += `### ⏱️ Key Timestamps & Chapters\n\n`;
    studySet.chapters.forEach(ch => {
      md += `- **[${ch.timestampFormatted}]** ${ch.title} — ${ch.summary}\n`;
    });
    md += `\n`;
  }

  md += `---\n\n`;
  md += `## 📝 Practice Quiz Questions\n\n`;

  studySet.questions.forEach((q, idx) => {
    md += `### Question ${idx + 1} (${q.difficulty.toUpperCase()} • ${q.topicTag})\n\n`;
    md += `> **${q.question}**\n\n`;
    q.options.forEach((opt, optIdx) => {
      md += `- [ ] **${optLabels[optIdx]}**: ${opt}\n`;
    });
    md += `\n<details>\n<summary>🔍 Click to view Answer & Explanation (Timestamp: ${q.timestampFormatted})</summary>\n\n`;
    md += `**Correct Answer:** **${optLabels[q.correctIndex]}** (${q.options[q.correctIndex]})\n\n`;
    md += `**Explanation:** ${q.explanation}\n\n`;
    if (q.hint) {
      md += `*Hint:* ${q.hint}\n`;
    }
    md += `</details>\n\n---\n\n`;
  });

  md += `## 🗂️ Flashcards & Terminology\n\n`;
  studySet.flashcards.forEach(f => {
    md += `### ${f.front}\n\n`;
    md += `**Definition / Explanation:** ${f.back}\n\n`;
    if (f.keyTakeaway) {
      md += `*Key Memory Anchor:* ${f.keyTakeaway}\n\n`;
    }
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeFilename = (studySet.videoTitle || 'Study_Guide')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
  link.setAttribute('download', `${safeFilename}_Cheatsheet_StudyGuide.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
