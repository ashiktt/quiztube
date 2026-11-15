import { jsPDF } from 'jspdf';
import { SABERIO_LOGO_BASE64 } from './logoBase64';

export interface FirstPageHeaderOptions {
  subject: string;
  documentTitle?: string;
  academicLevel?: string;
  totalMarks?: number;
  itemCount?: number;
  itemCountLabel?: string;
  margin?: number;
  pageWidth?: number;
}

export interface RunningHeaderOptions {
  subject: string;
  rightLabel?: string;
  margin?: number;
  pageWidth?: number;
  headerY?: number;
  lineY?: number;
}

/**
 * Resets all global text state on jsPDF instance to ensure clean, consistent typography
 */
export function resetPdfTypographyState(doc: jsPDF): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.2);
  if (typeof (doc as any).setCharSpace === 'function') {
    (doc as any).setCharSpace(0);
  }
}

/**
 * Converts raw LaTeX expressions and mathematical symbols into clean, 100% readable text
 * suitable for PDF generation with standard fonts (no unreadable symbols, no raw LaTeX codes).
 */
export function sanitizeLatexAndSymbols(text: string): string {
  if (!text) return '';

  return text
    // 1. Common Greek Letters (Convert to clean, readable standard names)
    .replace(/\\Sigma\b/g, 'Sigma')
    .replace(/\\sigma\b/g, 'sigma')
    .replace(/\\Lambda\b/g, 'Lambda')
    .replace(/\\lambda\b/g, 'lambda')
    .replace(/\\Delta\b/g, 'Delta')
    .replace(/\\delta\b/g, 'delta')
    .replace(/\\Theta\b/g, 'Theta')
    .replace(/\\theta\b/g, 'theta')
    .replace(/\\Alpha\b/g, 'Alpha')
    .replace(/\\alpha\b/g, 'alpha')
    .replace(/\\Beta\b/g, 'Beta')
    .replace(/\\beta\b/g, 'beta')
    .replace(/\\Gamma\b/g, 'Gamma')
    .replace(/\\gamma\b/g, 'gamma')
    .replace(/\\Omega\b/g, 'Omega')
    .replace(/\\omega\b/g, 'omega')
    .replace(/\\pi\b/g, 'pi')
    .replace(/\\epsilon\b/g, 'epsilon')
    .replace(/\\phi\b/g, 'phi')
    .replace(/\\Phi\b/g, 'Phi')
    .replace(/\\mu\b/g, 'mu')

    // 2. Set Theory & Logic Symbols
    .replace(/\\in\b/g, ' in ')
    .replace(/\\notin\b/g, ' not in ')
    .replace(/\\subset(eq)?\b/g, ' subset of ')
    .replace(/\\supset(eq)?\b/g, ' superset of ')
    .replace(/\\cup\b/g, ' union ')
    .replace(/\\cap\b/g, ' intersection ')
    .replace(/\\emptyset\b/g, '{}')
    .replace(/\\forall\b/g, 'for all ')
    .replace(/\\exists\b/g, 'there exists ')

    // 3. Mathematical Operations & Relations
    .replace(/\\rightarrow\b|\\to\b/g, ' -> ')
    .replace(/\\leftarrow\b/g, ' <- ')
    .replace(/\\Rightarrow\b|\\implies\b/g, ' => ')
    .replace(/\\le\b|\\leq\b/g, ' <= ')
    .replace(/\\ge\b|\\geq\b/g, ' >= ')
    .replace(/\\ne\b|\\neq\b/g, ' != ')
    .replace(/\\approx\b/g, ' ~= ')
    .replace(/\\times\b/g, ' * ')
    .replace(/\\cdot\b/g, ' . ')
    .replace(/\\pm\b/g, ' +/- ')
    .replace(/\\infty\b/g, 'infinity')

    // 4. Escaped Brackets & Delimiters
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .replace(/\\mid\b/g, ' | ')

    // 5. Common LaTeX formatting tags: \text{...}, \mathbf{...}, \mathit{...}
    .replace(/\\(?:text|mathbf|mathit|mathrm|mathcal)\{([^}]+)\}/g, '$1')

    // 6. Strip enclosing LaTeX math dollar signs ($...$ and $$...$$)
    .replace(/\$\$([^$]+)\$\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\\$/g, '$') // preserve explicitly escaped dollar if any

    // 7. Cleanup extra spaces
    .replace(/\s{2,}/g, ' ');
}

/**
 * Cleanly strips markdown characters and sanitizes unreadable LaTeX symbols,
 * preserving clean, readable academic notation, punctuation, and wording.
 */
export function cleanMarkdownText(text: string): string {
  if (!text) return '';
  const sanitized = sanitizeLatexAndSymbols(text);
  return sanitized
    .replace(/^#{1,6}\s+/gm, '') // remove heading hashes
    .replace(/\s+#+$/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1') // remove bold asterisks
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1$2$3') // remove italic asterisks
    .replace(/(^|[^_])_([^_]+)_([^_]|$)/g, '$1$2$3')
    .replace(/`([^`]+)`/g, '$1') // remove code backticks
    .replace(/^>\s*/gm, '') // remove blockquotes
    .replace(/::+/g, ':') // normalize duplicate colons
    .replace(/\.{4,}/g, '...') // normalize runaway dots
    .trim();
}

/**
 * Renders the official compact first-page branding header:
 * - Official Saberio AI Logo
 * - "SABERIO AI" Brand Name
 * - Tagline: "Quiz Maker  •  AI Tutor  •  Question Solver"
 * - Document Category Badge
 * - Right-aligned metadata
 * - Hairline separator
 */
export function drawPdfFirstPageHeader(
  doc: jsPDF,
  options: FirstPageHeaderOptions
): number {
  const margin = options.margin || 18;
  const pageWidth = options.pageWidth || doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  const startY = 16;

  // 1. Official Logo (14mm x 14mm, strict aspect ratio preserved)
  try {
    doc.addImage(SABERIO_LOGO_BASE64, 'JPEG', margin, startY, 14, 14);
  } catch (err) {
    console.warn('Failed to embed logo on first page:', err);
  }

  // 2. Brand Name & Tagline (positioned next to logo at margin + 17mm)
  const brandX = margin + 17;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Dark Navy / Slate 900
  doc.text('SABERIO AI', brandX, startY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Quiz Maker  •  AI Tutor  •  Question Solver', brandX, startY + 8.5);

  const docTitle = options.documentTitle || 'UNIVERSITY MODEL SOLUTIONS';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text(docTitle, brandX, startY + 12.5);

  // 3. Right-Aligned Metadata Region
  const rightX = pageWidth - margin;
  let metaY = startY + 4.5;

  if (options.academicLevel) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text(options.academicLevel, rightX, metaY, { align: 'right' });
    metaY += 4.2;
  }

  if (options.totalMarks !== undefined && options.totalMarks > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate 500
    const countLabel = options.itemCountLabel || 'Questions Solved';
    const countText = options.itemCount ? `  |  ${options.itemCount} ${countLabel}` : '';
    doc.text(`Total Marks: ${options.totalMarks}M${countText}`, rightX, metaY, { align: 'right' });
  }

  // 4. Subtle Hairline Separator below the brand header
  const separatorY = startY + 16.5;
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.2);
  doc.line(margin, separatorY, pageWidth - margin, separatorY);

  // 5. Subject / Course Title (17–19 pt bold)
  let yPos = separatorY + 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17.5);
  doc.setTextColor(15, 23, 42); // Dark Navy

  const subjectText = cleanMarkdownText(options.subject || 'University Examination Solutions');
  const titleLines = doc.splitTextToSize(subjectText, contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += titleLines.length * 7.0 + 3.0;

  resetPdfTypographyState(doc);
  return yPos;
}

/**
 * Renders subsequent page running header with mathematical collision protection:
 * LEFT: Small Saberio logo + Saberio AI + Subject Name (dynamically truncated if needed)
 * RIGHT: SABERIO AI • MODEL SOLUTIONS (right-aligned)
 * Guaranteed minimum 10mm gap between left and right regions!
 */
export function drawPdfRunningHeader(
  doc: jsPDF,
  options: RunningHeaderOptions
): void {
  const margin = options.margin || 18;
  const pageWidth = options.pageWidth || doc.internal.pageSize.getWidth();
  const headerY = options.headerY || 12;
  const lineY = options.lineY || 14.5;

  // 1. Measure Right Branding Region
  const rightLabel = options.rightLabel || 'SABERIO AI  •  MODEL SOLUTIONS';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400

  const rightWidth = doc.getTextWidth(rightLabel);
  const rightX = pageWidth - margin;

  // 2. Calculate Maximum Allowed Width for Left Region
  // Total available width = (rightX - rightWidth - 10mm gap) - margin
  const minGap = 10; // 10mm safety clearance
  const maxLeftX = rightX - rightWidth - minGap;
  const availableLeftWidth = maxLeftX - margin;

  // 3. Render Left Branding (Small logo + brand + subject)
  let curLeftX = margin;

  // Draw 4.5mm x 4.5mm logo icon
  try {
    doc.addImage(SABERIO_LOGO_BASE64, 'JPEG', curLeftX, headerY - 3.8, 4.5, 4.5);
    curLeftX += 6.0;
  } catch {
    // If image fails, proceed cleanly
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate 500
  const brandName = 'SABERIO AI';
  doc.text(brandName, curLeftX, headerY);
  curLeftX += doc.getTextWidth(brandName);

  // Subject title next to brand
  const rawSubject = (options.subject || 'UNIVERSITY EXAMINATION').toUpperCase();
  const subjectPrefix = '  •  ';
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400

  const subjectAvailWidth = maxLeftX - curLeftX;
  if (subjectAvailWidth > 15) {
    let fitSubject = subjectPrefix + cleanMarkdownText(rawSubject);
    if (doc.getTextWidth(fitSubject) > subjectAvailWidth) {
      let trimmed = fitSubject;
      while (trimmed.length > 5 && doc.getTextWidth(trimmed + '...') > subjectAvailWidth) {
        trimmed = trimmed.slice(0, -1);
      }
      fitSubject = trimmed.trim() + '...';
    }
    doc.text(fitSubject, curLeftX, headerY);
  }

  // 4. Render Right Label (Right-aligned)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(rightLabel, rightX, headerY, { align: 'right' });

  // 5. Hairline Separator Line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.15);
  doc.line(margin, lineY, rightX, lineY);

  resetPdfTypographyState(doc);
}

/**
 * Draws academic footer and running headers across all pages of a PDF:
 * LEFT: "Saberio AI  •  Study Smarter"
 * RIGHT: "Page X of Y"
 */
export function finalizePdfLayout(
  doc: jsPDF,
  options: {
    subject: string;
    rightHeaderLabel?: string;
    margin?: number;
  }
): void {
  const margin = options.margin || 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running header on pages 2+
    if (i > 1) {
      drawPdfRunningHeader(doc, {
        subject: options.subject,
        rightLabel: options.rightHeaderLabel,
        margin,
        pageWidth,
      });
    }

    // Running footer on EVERY page
    const footerY = pageHeight - 9.5;
    const lineY = pageHeight - 13.5;

    // Hairline divider above footer
    doc.setDrawColor(241, 245, 249); // Slate 100
    doc.setLineWidth(0.15);
    doc.line(margin, lineY, pageWidth - margin, lineY);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('Saberio AI  •  Study Smarter', margin, footerY);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }

  resetPdfTypographyState(doc);
}

/**
 * High-quality paragraph text renderer using native jsPDF string splitting.
 * Avoids character cramping, unnatural letter-spacing, or word collisions.
 */
export function renderNativeParagraph(
  doc: jsPDF,
  text: string,
  startX: number,
  yPos: number,
  availWidth: number,
  options?: {
    fontSize?: number;
    lineHeight?: number;
    textColor?: number[];
    isBold?: boolean;
    isItalic?: boolean;
  }
): { newY: number; linesCount: number } {
  const fontSize = options?.fontSize || 10.5;
  const lineHeight = options?.lineHeight || 5.2;
  const textColor = options?.textColor || [30, 41, 59]; // Slate 800

  if (options?.isBold) {
    doc.setFont('helvetica', 'bold');
  } else if (options?.isItalic) {
    doc.setFont('helvetica', 'italic');
  } else {
    doc.setFont('helvetica', 'normal');
  }

  doc.setFontSize(fontSize);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const clean = cleanMarkdownText(text);
  if (!clean) return { newY: yPos, linesCount: 0 };

  const lines = doc.splitTextToSize(clean, availWidth);
  doc.text(lines, startX, yPos);

  const newY = yPos + lines.length * lineHeight;
  resetPdfTypographyState(doc);
  return { newY, linesCount: lines.length };
}
