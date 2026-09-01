import { GoogleGenAI, Type, Schema } from '@google/genai';
import { SolvedQuestionItem, UniversitySolvedExam } from '@/types';

// Fallback cascade for model reliability
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-pro',
];

const solvedExamSchema: Schema = {
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
            description: 'Mermaid.js flowchart / sequence diagram code (e.g. flowchart TD ... or sequenceDiagram ...) illustrating the concept. Required for 10/15 mark questions. Omit backticks.',
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

  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please add it to your environment variables or enter it in the app.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are a Senior University Professor and Chief Examiner specializing in creating 100% accurate, high-scoring model answers for university examinations.

YOUR MISSION:
Analyze the provided university exam question paper (which may be provided as text, pasted questions, an uploaded photo/scan/image, or a PDF document), transcribe/read every question and its marks (e.g., 2, 5, 10, 15 marks), and generate structured, mark-proportional model solutions that would score 100% full marks from strict university examiners.

MULTIMODAL QUESTION PAPER EXTRACTION:
- If an image or PDF of a question paper is attached, carefully OCR and transcribe each question, its sub-parts (e.g. Q1(a), Q1(b)), and its assigned marks.
- If the subject is visible on the question paper header, identify and extract it.

MARK-PROPORTIONAL DEPTH & LENGTH RULES:
1. 🔹 2 MARKS (Short Answer / Definition):
   - Length: ~50 to 80 words.
   - Structure: Clear 1-sentence formal definition, followed by 2-3 precise bullet points or the core mathematical formula. No unnecessary fluff.

2. 🔹 5 MARKS (Medium Concept / Brief Explanation):
   - Length: ~150 to 250 words.
   - Structure: Brief Introduction -> 3-4 structured core points / operational steps -> relevant formula or code snippet -> 1 real-world example or use-case.

3. 🔹 10 MARKS (Long Answer / Analytical Essay):
   - Length: ~400 to 600 words.
   - Structure:
     - ### 1. Introduction & Theoretical Foundation
     - ### 2. Detailed Architecture / Core Working Mechanism (Include Mermaid.js diagram!)
     - ### 3. Mathematical Formulation / Code Implementation
     - ### 4. Real-World Practical Example & Industrial Application
     - ### 5. Advantages, Limitations & Trade-Offs

4. 🔹 15 MARKS (Comprehensive Thesis / Major Design Question):
   - Length: ~700 to 1000 words.
   - Structure:
     - ### 1. Problem Context & Fundamental Principles
     - ### 2. Comprehensive System Architecture & Dataflow (Include complex Mermaid.js flowchart)
     - ### 3. Complete Step-by-Step Derivation / Clean Code
     - ### 4. Comprehensive Comparison / Analytical Matrix Table
     - ### 5. Edge Cases, Failure Modes & Optimizations
     - ### 6. Academic Conclusion

MERMAID DIAGRAM RULES:
- For 5, 10, and 15 mark questions where visual architecture, workflow, data structure, or state machine applies, provide a clean valid Mermaid flowchart (e.g. flowchart TD or flowchart LR) in "diagramMermaid".
- Do NOT wrap the mermaid code in markdown backticks. Write raw mermaid code (e.g. "flowchart TD\\n  A[Input] --> B[Process]\\n  B --> C[Output]").
- Keep node labels safe: quote special characters e.g. ["Label (Info)"].

Return your response strictly adhering to the JSON schema.`;

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

  if (questionsText && questionsText.trim().length > 0) {
    textPrompt += `EXAM QUESTIONS / INSTRUCTIONS:\n"""\n${questionsText}\n"""\n\n`;
  } else {
    textPrompt += `Please transcribe and solve ALL questions present in the attached exam paper document/image.\n\n`;
  }

  textPrompt += `Please parse every question, detect or assign reasonable marks if unspecified, and generate comprehensive, mark-scaled model answers.`;

  contentParts.push(textPrompt);

  const modelsToTry = preferredModel
    ? [preferredModel, ...FALLBACK_MODELS.filter(m => m !== preferredModel)]
    : FALLBACK_MODELS;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contentParts,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: solvedExamSchema,
          temperature: 0.2, // Low temperature for high academic precision
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error(`Empty response from model ${modelName}`);
      }

      const parsed = JSON.parse(text);

      const solvedExam: UniversitySolvedExam = {
        id: `exam-solution-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        subject: parsed.subject || subject,
        academicLevel: parsed.academicLevel || academicLevel,
        totalMarks: Number(parsed.totalMarks) || (parsed.solutions || []).reduce((acc: number, curr: any) => acc + (Number(curr.marksAllocated) || 5), 0),
        rawQuestionsText: questionsText || (fileName ? `[File: ${fileName}]` : 'Uploaded Question Paper'),
        overallExamSummary: parsed.overallExamSummary || 'University Exam Model Solutions',
        solutions: parsed.solutions || [],
      };

      return solvedExam;
    } catch (err: any) {
      console.warn(`Model ${modelName} failed in exam solver:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to solve university questions with all available AI models.');
}
