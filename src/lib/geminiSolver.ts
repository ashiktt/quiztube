/**
 * Saberio AI - University Question Solver Engine
 * Refactored with Modular AI Reasoning Architecture:
 * - Phase 2: Autonomous question classification & specialized reasoning strategy
 * - Phase 3: Academic prompt engine with mark-scaled depth calibration
 * - Phase 4: Response quality validation & targeted auto-repair
 * - Phase 5: Smart Mermaid diagram generation & syntax validation
 * - Phase 6: Multi-model orchestration, retry with backoff, and caching
 */

import { Type, Schema } from '@google/genai';
import { SolvedQuestionItem, UniversitySolvedExam } from '@/types';
import { buildAcademicSystemInstruction } from './ai/academicPromptEngine';
import { executeModelWithOrchestration } from './ai/modelOrchestrator';
import { validateAndRepairSolution } from './ai/responseValidator';

export const solvedExamSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: {
      type: Type.STRING,
      description: 'The academic course, subject, or discipline of the exam.',
    },
    academicLevel: {
      type: Type.STRING,
      description: 'The academic level (e.g. Undergraduate / B.Tech / BSC / Masters).',
    },
    totalMarks: {
      type: Type.INTEGER,
      description: 'The sum of marks across all solved questions in the exam paper.',
    },
    overallExamSummary: {
      type: Type.STRING,
      description: 'A 2-3 sentence academic overview summarizing key concepts tested in this exam paper.',
    },
    solutions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionNumber: {
            type: Type.STRING,
            description: 'The question label e.g. "Q1", "Q1(a)", "Question 2".',
          },
          questionText: {
            type: Type.STRING,
            description: 'The complete question text as parsed or transcribed from the input image/PDF/text.',
          },
          marksAllocated: {
            type: Type.INTEGER,
            description: 'The marks allocated for this question (e.g. 2, 5, 10, 15). Default to 5 if unspecified.',
          },
          answerSummary: {
            type: Type.STRING,
            description: 'A 1-2 sentence core thesis / TL;DR answer to the question.',
          },
          detailedAnswer: {
            type: Type.STRING,
            description: 'Markdown-formatted comprehensive model answer structured strictly according to marks with subheadings (#, ##), bold terms, and paragraphs.',
          },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3-6 high-yield bullet points an examiner looks for to award full marks.',
          },
          formulasOrCode: {
            type: Type.STRING,
            description: 'Relevant mathematical formulation, equation, or clean code snippet (with comments). Omit or leave empty if not applicable.',
          },
          diagramMermaid: {
            type: Type.STRING,
            description: 'Clean Mermaid.js flowchart or architecture diagram code (e.g. flowchart TD ... or sequenceDiagram ...). Provide whenever a visual diagram, system architecture, flowchart, or data pipeline clarifies the solution. Omit markdown backticks.',
          },
          examTips: {
            type: Type.STRING,
            description: 'Insider tips from an examiner on common mistakes, what to highlight, or keywords to underline.',
          },
          estimatedWordCount: {
            type: Type.INTEGER,
            description: 'Approximate word count of the detailed answer.',
          },
        },
        required: [
          'questionNumber',
          'questionText',
          'marksAllocated',
          'answerSummary',
          'detailedAnswer',
          'keyPoints',
        ],
      },
    },
  },
  required: ['subject', 'totalMarks', 'overallExamSummary', 'solutions'],
};

export async function solveUniversityQuestionsWithGemini(params: {
  questionsText?: string;
  subject?: string;
  academicLevel?: string;
  customApiKey?: string;
  preferredModel?: string;
  fileBase64?: string;
  fileMimeType?: string;
  fileName?: string;
}): Promise<UniversitySolvedExam> {
  const {
    questionsText = '',
    subject = 'University Examination',
    academicLevel = 'Undergraduate / B.Tech / BSC',
    customApiKey,
    preferredModel,
    fileBase64,
    fileMimeType,
    fileName,
  } = params;

  const systemInstruction = buildAcademicSystemInstruction({
    subject,
    academicLevel,
  });

  // Build multimodal content parts
  const contentParts: any[] = [];

  if (fileBase64 && fileMimeType) {
    const rawData = fileBase64.replace(/^data:[^;]+;base64,/, '');
    contentParts.push({
      inlineData: {
        data: rawData,
        mimeType: fileMimeType,
      },
    });
  }

  let textPrompt = `SUBJECT / COURSE: ${subject}\nACADEMIC TARGET LEVEL: ${academicLevel}\n\n`;
  if (fileName) {
    textPrompt += `ATTACHED FILE NAME: ${fileName}\n`;
  }

  if (fileBase64 && fileMimeType) {
    textPrompt += `ATTACHED EXAM DOCUMENT / IMAGE: A university question paper file (${fileName || 'document'}) is attached.\n`;
    textPrompt += `MANDATORY INSTRUCTION: Inspect the attached file carefully, transcribe EVERY question and sub-question (e.g., Q1(a), Q1(b), Q2(a)...), and solve ALL OF THEM in full detail without omitting any question.\n\n`;
  }

  if (questionsText && questionsText.trim().length > 0) {
    textPrompt += `EXAM QUESTIONS / USER PROMPTS:\n"""\n${questionsText}\n"""\n\n`;
    textPrompt += `MANDATORY INSTRUCTION: Solve ALL questions listed above. If questions contain multiple sub-parts (e.g., Q1(a), Q1(b)), solve every sub-part completely.\n\n`;
  }

  textPrompt += `CRITICAL COMPLETENESS RULES:
1. COMPLETE QUESTION COVERAGE: Include a complete solution object in the "solutions" array for EVERY question and sub-part found in the input (text or attached document/image). Do NOT skip, merge, or abbreviate any question.
2. FULL UNABBREVIATED ANSWERS: In each solution's "detailedAnswer", provide the FULL, comprehensive academic model answer. Address every single concept, phase, step, formula, diagram, and sub-part asked in the question.
3. NEVER TRUNCATE: Never cut off mid-sentence, never write "etc." or "so on", and never provide partial outlines. Give university students the complete, full-scoring model solution.`;

  contentParts.push({ text: textPrompt });

  // Execute request through the Model Orchestrator
  const executionResult = await executeModelWithOrchestration(
    [{ role: 'user', parts: contentParts }],
    {
      apiKey: customApiKey,
      preferredModel,
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: solvedExamSchema,
      temperature: 0.2, // Low temperature for high academic precision
      timeoutMs: 90000, // 90 seconds timeout for full multi-question solutions
      maxOutputTokens: 16384,
    }
  );

  const rawJsonText = executionResult.text;
  let parsed: any;
  try {
    parsed = JSON.parse(rawJsonText);
  } catch (parseErr) {
    throw new Error('Failed to parse model response into valid exam JSON format.');
  }

  const rawSolutions: any[] = Array.isArray(parsed.solutions) ? parsed.solutions : [];

  // Phase 4: Run Response Quality Validation & Auto-Repair Pipeline on every solution
  const validatedSolutions: SolvedQuestionItem[] = rawSolutions.map((item: any, idx: number) => {
    const rawItem: SolvedQuestionItem = {
      questionNumber: item.questionNumber || `Q${idx + 1}`,
      questionText: item.questionText || `Question ${idx + 1}`,
      marksAllocated: Number(item.marksAllocated) || 5,
      answerSummary: item.answerSummary || '',
      detailedAnswer: item.detailedAnswer || '',
      keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints : [],
      formulasOrCode: item.formulasOrCode || undefined,
      diagramMermaid: item.diagramMermaid || undefined,
      examTips: item.examTips || undefined,
      estimatedWordCount: item.estimatedWordCount || undefined,
    };

    const validationReport = validateAndRepairSolution(rawItem, subject);
    return validationReport.repairedItem;
  });

  const totalCalculatedMarks = validatedSolutions.reduce(
    (sum, sol) => sum + (Number(sol.marksAllocated) || 5),
    0
  );

  const solvedExam: UniversitySolvedExam = {
    id: `exam-solution-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    subject: parsed.subject || subject,
    academicLevel: parsed.academicLevel || academicLevel,
    totalMarks: Number(parsed.totalMarks) || totalCalculatedMarks || 10,
    rawQuestionsText: questionsText || (fileName ? `[File: ${fileName}]` : 'Uploaded Question Paper'),
    overallExamSummary: parsed.overallExamSummary || 'University Exam Model Solutions',
    solutions: validatedSolutions,
  };

  return solvedExam;
}
