import { GoogleGenAI, Type, Schema } from '@google/genai';
import { SolvedQuestionItem, UniversitySolvedExam } from '@/types';

// Fallback cascade for model reliability
const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-pro-preview',
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
            description: 'Clean Mermaid.js flowchart or architecture diagram code (e.g. flowchart TD ... or sequenceDiagram ...). Provide whenever a visual diagram, system architecture, flowchart, or data pipeline clarifies the solution (for 3, 5, 8, 10, or 15 mark questions). Omit markdown backticks.',
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
Analyze the provided university exam question paper (which may be provided as text, pasted questions, an uploaded photo/scan/image, or a PDF document), transcribe/read every question and its marks (e.g., 2, 3, 5, 8, 10, 15 marks), and generate structured, mark-proportional model solutions that would score 100% full marks from strict university examiners.

MULTIMODAL QUESTION PAPER EXTRACTION:
- If an image or PDF of a question paper is attached, carefully OCR and transcribe each question, its sub-parts (e.g. Q1(a), Q1(b)), and its assigned marks.
- If the subject is visible on the question paper header, identify and extract it.

MARK-PROPORTIONAL DEPTH & CALIBRATION GUIDELINES:
Answers must be moderately detailed, technically complete, and directly proportional to marks. Prioritize marks-worthy information over unnecessary length:

1. 🔹 2 MARKS (Short Answer / Definition):
   - Target length: 40–60 words.
   - Structure: Formal 1-2 sentence definition followed by 2 concise bullet points or the core formula.

2. 🔹 3 MARKS (Conceptual Note / Brief Comparison):
   - Target length: 60–90 words.
   - Structure: Accurate definition + core technical mechanism / comparison + 2-3 essential technical points.

3. 🔹 5 MARKS (Medium Concept / Working Principle):
   - Target length: 110–150 words.
   - Structure: Clear definition/introduction -> Core explanation & working principle -> 3-4 structured technical points -> 1 practical example or use-case -> visual diagram if architectural or procedural.

4. 🔹 8 MARKS (Analytical / Design / Detailed Comparison):
   - Target length: 180–240 words.
   - Structure: Formal theoretical foundation -> In-depth working mechanism & characteristics -> Advantages & limitations/trade-offs -> Practical example -> Visual architecture or flowchart diagram (Mermaid).

5. 🔹 10 MARKS (Long Answer / Comprehensive Question):
   - Target length: 250–330 words.
   - Structure:
     - ### 1. Definition & Theoretical Foundation
     - ### 2. System Architecture / Working Principle (Include visual Mermaid diagram)
     - ### 3. Technical Formulation / Pseudocode / Comparison Matrix
     - ### 4. Concrete Real-World Example / Industrial Application
     - ### 5. Critical Advantages, Trade-offs & Limitations

6. 🔹 15 MARKS (Major Design / Comprehensive Thesis):
   - Target length: 380–500 words.
   - Complete, rigorous breakdown covering principles, detailed architecture, derivation/code, analytical comparison table, and edge cases.

SPECIALIZATION BY QUESTION TYPE:
- 🔢 Numerical Questions: Prioritize step-by-step calculations, explicit formulas with defined variables, and clear final boxed answers.
- ⚡ Algorithm Questions: Prioritize clear logic, clean structured pseudocode, and time/space complexity analysis (Big-O).
- 📖 Theory & Conceptual Questions: Prioritize unambiguous definitions, precise technical terminology, operational principles, and advantages/disadvantages.
- 📐 Diagram-Based & Architectural Questions (e.g. DDBMS architecture, OSI layers, Compiler phases, Memory hierarchy): ALWAYS include a relevant, clean Mermaid diagram.

ANSWER COMPLETENESS & FORMATTING RULES:
- Provide clear, standard definitions and explain important technical terminology.
- Include working principles, characteristics, advantages, and disadvantages when relevant.
- Add short, concrete practical examples (e.g., e-commerce replication, banking transactions).
- In bullet lists, use bold lead-in titles for key concepts (e.g., "- **Enhanced Availability:** Data replication ensures...").
- Format subheadings with standard markdown (e.g., "### Definition", "### Advantages").
- When comparing concepts, use standard Markdown tables (e.g., "| Feature | System A | System B |").
- Avoid repeating information. Do not add irrelevant historical background, generic introductions, or filler conclusions.
- Keep the language student-friendly while strictly technically accurate.

MERMAID DIAGRAM RULES:
- Whenever a system architecture, flowchart, data pipeline, state machine, or ER diagram clarifies the answer, provide valid Mermaid code in "diagramMermaid".
- Do NOT wrap the mermaid code in markdown backticks in the JSON field. Write raw mermaid code (e.g. "flowchart TD\\n  A[Client] --> B[Server]\\n  B --> C[(Database)]").
- Keep node labels safe: quote special characters e.g. ["Label (Info)"].
- Keep diagrams clean, readable, and properly oriented (TD or LR).

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
