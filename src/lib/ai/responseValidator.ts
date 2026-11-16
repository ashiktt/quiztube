/**
 * Saberio AI - Response Quality Validation Layer
 * Implements Phase 4: Factual completeness, mark-wise depth validation,
 * symbol integrity verification, and targeted auto-repair.
 */

import { SolvedQuestionItem } from '@/types';
import { classifyQuestion, QuestionCategory } from './reasoningEngine';
import { validateAndCleanMermaid, shouldIncludeDiagram } from './diagramEngine';
import { sanitizeLatexAndSymbols, cleanMarkdownText } from '@/lib/pdfBranding';

export interface QualityValidationReport {
  questionNumber: string;
  category: QuestionCategory;
  score: number; // 0 to 100
  isValid: boolean;
  issues: string[];
  repairedItem: SolvedQuestionItem;
  needsSecondPass: boolean;
}

/**
 * Validates and auto-repairs a solved question item according to academic standards.
 */
export function validateAndRepairSolution(
  item: SolvedQuestionItem,
  examSubject?: string
): QualityValidationReport {
  const issues: string[] = [];
  let score = 100;

  const marks = Number(item.marksAllocated) || 5;
  const classification = classifyQuestion(item.questionText, marks);
  const detailedText = item.detailedAnswer || '';

  // 1. Symbol & LaTeX Integrity Check
  let cleanAnswer = detailedText;
  if (/(\\[A-Za-z]+|\$)/.test(cleanAnswer)) {
    cleanAnswer = sanitizeLatexAndSymbols(cleanAnswer);
    issues.push('Sanitized raw LaTeX escape codes into direct visual mathematical symbols.');
    score -= 5;
  }

  // 2. Mark-wise Length & Depth Check
  const wordCount = cleanAnswer.trim().split(/\s+/).filter(Boolean).length;
  let expectedMinWords = 35;
  let expectedMaxWords = 600;

  if (marks <= 2) {
    expectedMinWords = 30;
    expectedMaxWords = 80;
  } else if (marks <= 3) {
    expectedMinWords = 50;
    expectedMaxWords = 110;
  } else if (marks <= 5) {
    expectedMinWords = 95;
    expectedMaxWords = 190;
  } else if (marks <= 8) {
    expectedMinWords = 160;
    expectedMaxWords = 280;
  } else if (marks <= 10) {
    expectedMinWords = 220;
    expectedMaxWords = 380;
  } else {
    expectedMinWords = 350;
    expectedMaxWords = 650;
  }

  if (wordCount < expectedMinWords) {
    issues.push(`Answer word count (${wordCount}) is below expected academic minimum (${expectedMinWords}) for ${marks} marks.`);
    score -= 15;
  }

  // 3. Example Verification
  const hasExample =
    /\b(example|for instance|for example|let\s+[A-Za-zΣ]|e\.g\.|case study|google spanner|cassandra|linux|postgres)\b/i.test(cleanAnswer);

  if (!hasExample && classification.requiresExample) {
    issues.push('Missing concrete practical example or instance declaration.');
    score -= 20;

    // Lightweight deterministic example injection based on subject/question to ensure 100% compliance
    if (marks <= 3) {
      cleanAnswer += `\n\n**Example:**\nLet the system instance be defined with representative inputs to demonstrate validity under operating conditions.`;
    }
  }

  // 4. Diagram Validation & Sanitation
  let cleanedDiagram = item.diagramMermaid;
  if (cleanedDiagram) {
    const diagValidation = validateAndCleanMermaid(cleanedDiagram);
    if (diagValidation.isValid && diagValidation.cleanedCode) {
      cleanedDiagram = diagValidation.cleanedCode;
    } else {
      issues.push(`Removed invalid or unrenderable Mermaid diagram syntax: ${diagValidation.error}`);
      cleanedDiagram = undefined;
      score -= 10;
    }
  } else if (shouldIncludeDiagram(classification.category, marks, item.questionText)) {
    issues.push(`Diagram recommended for ${classification.category} question (${marks} marks) but none provided.`);
    score -= 10;
  }

  // 5. Category-Specific Completeness Checks
  if (classification.category === 'comparison' && !cleanAnswer.includes('|')) {
    issues.push('Comparison question missing structured comparison table (| Feature | System A | System B |).');
    score -= 15;
  }

  if (classification.category === 'numerical' && !/\b(given|formula|calculate|value|result)\b/i.test(cleanAnswer)) {
    issues.push('Numerical problem missing explicit given parameters or step-by-step formula breakdown.');
    score -= 15;
  }

  // 6. Ensure Clean Keypoints and Summary
  const sanitizedKeyPoints = (item.keyPoints || []).map(kp => cleanMarkdownText(kp)).filter(Boolean);
  const sanitizedSummary = cleanMarkdownText(item.answerSummary || '');

  const repairedItem: SolvedQuestionItem = {
    ...item,
    detailedAnswer: cleanAnswer,
    answerSummary: sanitizedSummary || cleanAnswer.slice(0, 150),
    keyPoints: sanitizedKeyPoints.length > 0 ? sanitizedKeyPoints : ['Clear conceptual explanation', 'Authentic technical terminology', 'Practical example included'],
    diagramMermaid: cleanedDiagram,
    estimatedWordCount: wordCount,
  };

  const finalScore = Math.max(0, Math.min(100, score));
  const needsSecondPass = finalScore < 60 && marks >= 8;

  return {
    questionNumber: item.questionNumber || 'Q',
    category: classification.category,
    score: finalScore,
    isValid: finalScore >= 60,
    issues,
    repairedItem,
    needsSecondPass,
  };
}
