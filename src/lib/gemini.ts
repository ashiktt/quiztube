import { GoogleGenAI, Type, Schema } from '@google/genai';
import {
  DifficultyLevel,
  Flashcard,
  LectureChapter,
  LectureCheatsheet,
  QuizQuestion,
  QuestionType,
} from '@/types';
import { parseTimestampToSeconds } from './youtube';

export interface GeneratedStudySetData {
  videoTitle: string;
  overallSummary: string;
  keyTakeaways: string[];
  chapters: LectureChapter[];
  questions: QuizQuestion[];
  flashcards: Flashcard[];
  cheatsheet?: LectureCheatsheet;
}

export const studySetResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    videoTitle: {
      type: Type.STRING,
      description: 'Clear, concise educational title for the lecture or topic',
    },
    overallSummary: {
      type: Type.STRING,
      description: 'A comprehensive, well-structured multi-paragraph summary of the lecture concepts',
    },
    keyTakeaways: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '5-8 high-yield educational takeaways, formulas, or principles',
    },
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          timestampFormatted: { type: Type.STRING, description: 'Timestamp like 02:45 or 14:20' },
          timestampSeconds: { type: Type.INTEGER },
          summary: { type: Type.STRING },
        },
        required: ['title', 'timestampFormatted', 'timestampSeconds', 'summary'],
      },
      description: 'Key sections and chapters of the lecture mapped to timestamps',
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING, description: 'Clear, thought-provoking question testing student comprehension' },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '4 answer choices (or 2 for True/False)',
          },
          correctIndex: { type: Type.INTEGER, description: '0-based index of the correct answer' },
          explanation: { type: Type.STRING, description: 'In-depth explanation of why the correct answer is right and the underlying principle' },
          optionExplanations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Brief explanation for each option explaining why it is correct or incorrect',
          },
          hint: { type: Type.STRING, description: 'A helpful hint to guide the student without revealing the answer immediately' },
          timestampFormatted: { type: Type.STRING, description: 'Exact timestamp in the lecture (e.g. 05:12) where this concept is discussed' },
          timestampSeconds: { type: Type.INTEGER, description: 'Exact seconds corresponding to timestampFormatted' },
          topicTag: { type: Type.STRING, description: 'Specific concept or sub-topic tag' },
          difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
          bloomsLevel: { type: Type.STRING, enum: ['Recall', 'Understanding', 'Application', 'Analysis'] },
        },
        required: [
          'id',
          'question',
          'options',
          'correctIndex',
          'explanation',
          'hint',
          'timestampFormatted',
          'timestampSeconds',
          'topicTag',
          'difficulty',
        ],
      },
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          front: { type: Type.STRING, description: 'Concept, term, question, or formula on the front' },
          back: { type: Type.STRING, description: 'Clear definition, explanation, or answer on the back' },
          keyTakeaway: { type: Type.STRING, description: 'Short memory anchor or mnemonic' },
          timestampFormatted: { type: Type.STRING },
          timestampSeconds: { type: Type.INTEGER },
          topicTag: { type: Type.STRING },
        },
        required: ['id', 'front', 'back', 'keyTakeaway', 'topicTag'],
      },
    },
    cheatsheet: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        subtitle: { type: Type.STRING },
        coreFormulas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              formula: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['label', 'formula', 'explanation'],
          },
          description: 'High-yield formulas, math equations, or core code rules',
        },
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              formulaOrCode: { type: Type.STRING },
              mermaidCode: { type: Type.STRING },
              timestampFormatted: { type: Type.STRING },
              timestampSeconds: { type: Type.INTEGER },
            },
            required: ['title', 'keyPoints'],
          },
        },
        comparisonTable: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            headers: { type: Type.ARRAY, items: { type: Type.STRING } },
            rows: {
              type: Type.ARRAY,
              items: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
          required: ['title', 'headers', 'rows'],
          description: 'Comparison matrix table contrasting algorithms, concepts, or terms',
        },
        flowchart: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            mermaidCode: {
              type: Type.STRING,
              description: 'Valid Mermaid flowchart code (e.g. graph TD; A[Input] --> B[Processing] --> C[Output])',
            },
            description: { type: Type.STRING },
          },
          required: ['title', 'mermaidCode'],
        },
        pitfalls: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              misconception: { type: Type.STRING },
              correctFact: { type: Type.STRING },
              whyItMatters: { type: Type.STRING },
            },
            required: ['misconception', 'correctFact', 'whyItMatters'],
          },
          description: 'Common misconceptions and mistakes students make on exams',
        },
      },
      required: ['title', 'subtitle', 'coreFormulas', 'sections'],
    },
  },
  required: ['videoTitle', 'overallSummary', 'keyTakeaways', 'chapters', 'questions', 'flashcards', 'cheatsheet'],
};

// Candidate models in order of stability and performance
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-pro',
];

/**
 * Extracts a clean user-friendly error message from Gemini API errors
 */
export function formatGeminiErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const msg = typeof error === 'string' ? error : error.message || JSON.stringify(error);

  try {
    const parsed = JSON.parse(msg);
    if (parsed.error?.message) {
      if (parsed.error.code === 503 || parsed.error.status === 'UNAVAILABLE') {
        return 'Google Gemini servers are currently experiencing temporary high demand. Please try again in a few moments.';
      }
      if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
        return 'Rate limit exceeded on Gemini API. Please wait a moment or verify your quota in Google AI Studio.';
      }
      return parsed.error.message;
    }
  } catch {
    // Not JSON string
  }

  if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
    return 'Google Gemini servers are currently experiencing temporary high demand. Please try again in a few moments.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API rate limit reached. Please wait a moment before trying again.';
  }
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
    return 'The provided Gemini API key is invalid. Please check your key in the app settings.';
  }

  return msg;
}

/**
 * Helper sleep function for backoff
 */
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Generates an educational study set with full visual cheatsheet from transcript
 */
export async function generateStudySetWithGemini(params: {
  transcriptWithTimestamps: string;
  lectureTitle?: string;
  numQuestions: number;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  topicFocus?: string;
  customApiKey?: string;
  preferredModel?: string;
}): Promise<GeneratedStudySetData> {
  const apiKey = params.customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Gemini API key is required. Please set GEMINI_API_KEY in your environment or provide it in the app settings.'
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const difficultyPrompt =
    params.difficulty === 'easy'
      ? 'Focus on fundamental definitions, core terminology, and basic concept recall (Beginner/Introductory level).'
      : params.difficulty === 'hard'
      ? 'Focus on advanced concept application, edge cases, deep analysis, synthesis, and tricky nuances (Advanced/College level).'
      : params.difficulty === 'medium'
      ? 'Focus on understanding, conceptual reasoning, and standard problem solving (Intermediate level).'
      : 'Provide a balanced mix: 30% easy/fundamental, 50% medium/applied, and 20% challenging/analytical.';

  const questionTypePrompt =
    params.questionType === 'true_false'
      ? 'Format all questions as True/False questions (exactly 2 options: ["True", "False"]).'
      : params.questionType === 'mcq'
      ? 'Format all questions as 4-option multiple-choice questions with 1 clear correct answer and 3 plausible distractors.'
      : 'Include a balanced mix of 4-option Multiple Choice and True/False questions.';

  const topicFocusPrompt = params.topicFocus
    ? `Pay special attention to and emphasize questions related to: "${params.topicFocus}".`
    : '';

  const systemInstruction = `You are an elite academic professor and master visual educator creating high-yield active-recall study materials and a visual cheatsheet for university students.

Your objectives:
1. Thoroughly analyze the provided lecture transcript (which includes timestamps in [MM:SS] or [HH:MM:SS] format).
2. Generate an accurate, comprehensive, multi-paragraph overall summary.
3. Identify 5-8 key takeaways / core principles.
4. Break down the lecture into key chronological chapters with timestamps.
5. Create exactly ${params.numQuestions} high-quality quiz questions aligned with:
   - Target difficulty: ${params.difficulty} (${difficultyPrompt})
   - Question format: ${questionTypePrompt}
   - ${topicFocusPrompt}
   - CRITICAL: For EVERY question, identify the exact timestamp in the lecture [MM:SS] where that concept was taught, and calculate timestampSeconds.
   - For every question, provide an in-depth pedagogical explanation of WHY the answer is correct and why other options are common misconceptions or incorrect.
   - Provide a clever hint that scaffolds the student's thinking.
6. Create 6-12 spaced-repetition flashcards covering core terms, equations, definitions, and mental models.
7. Generate a comprehensive Visual Cheatsheet containing:
   - Core Formulas: 3-6 mathematical formulas, equations, or fundamental rules with explanations.
   - Comparison Table: A structured comparison matrix comparing key techniques, algorithms, or concepts from the lecture.
   - Visual Flowchart (Mermaid): A valid Mermaid flowchart (e.g. "graph TD; A[Input Vector x] --> B[Dot Product w^T*x + b] --> C[Non-linear Activation g(z)] --> D[Prediction y_hat]") illustrating the core process or architecture taught in the lecture.
   - Sections with practical rules and timestamp links.
   - Pitfalls: 3-5 common student misconceptions vs correct facts and why they matter.

Ensure all content is grounded strictly in the material covered in the transcript.
Output MUST strictly conform to the JSON schema.`;

  const userPrompt = `Here is the lecture transcript with timestamps:
${params.lectureTitle ? `Lecture Title: ${params.lectureTitle}\n\n` : ''}
${params.transcriptWithTimestamps.slice(0, 65000)}

Please generate the complete study set (Summary, Key Takeaways, Chapters, ${params.numQuestions} Quiz Questions, Flashcards, and Visual Cheatsheet with valid Mermaid diagram) following all instructions and schema.`;

  // Build model candidate list
  const candidateModels = params.preferredModel
    ? [params.preferredModel, ...FALLBACK_MODELS.filter(m => m !== params.preferredModel)]
    : FALLBACK_MODELS;

  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const modelName = candidateModels[i];
    try {
      console.log(`Attempting study set generation with model: ${modelName} (attempt ${i + 1}/${candidateModels.length})`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: studySetResponseSchema,
          temperature: 0.25,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error(`Model ${modelName} returned an empty response.`);
      }

      const parsedData = JSON.parse(responseText) as GeneratedStudySetData;

      // Post-process to ensure all IDs and timestamps are properly normalized
      parsedData.questions = (parsedData.questions || []).map((q, idx) => {
        const tsSeconds = q.timestampSeconds || parseTimestampToSeconds(q.timestampFormatted || '00:00');
        return {
          ...q,
          id: q.id || `q-${idx + 1}`,
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
          options:
            Array.isArray(q.options) && q.options.length > 0
              ? q.options
              : ['Option A', 'Option B', 'Option C', 'Option D'],
          timestampSeconds: tsSeconds,
          timestampFormatted: q.timestampFormatted || '00:00',
          topicTag: q.topicTag || 'General Concept',
          difficulty: q.difficulty || 'medium',
        };
      });

      parsedData.flashcards = (parsedData.flashcards || []).map((f, idx) => {
        const tsSeconds = f.timestampSeconds || parseTimestampToSeconds(f.timestampFormatted || '00:00');
        return {
          ...f,
          id: f.id || `card-${idx + 1}`,
          timestampSeconds: tsSeconds,
          timestampFormatted: f.timestampFormatted || '00:00',
          topicTag: f.topicTag || 'Key Concept',
        };
      });

      parsedData.chapters = (parsedData.chapters || []).map(ch => ({
        ...ch,
        timestampSeconds: ch.timestampSeconds || parseTimestampToSeconds(ch.timestampFormatted || '00:00'),
      }));

      // Normalize cheatsheet section timestamps
      if (parsedData.cheatsheet?.sections) {
        parsedData.cheatsheet.sections = parsedData.cheatsheet.sections.map(sec => ({
          ...sec,
          timestampSeconds:
            sec.timestampSeconds ||
            (sec.timestampFormatted ? parseTimestampToSeconds(sec.timestampFormatted) : undefined),
        }));
      }

      return parsedData;
    } catch (error: any) {
      lastError = error;
      const formatted = formatGeminiErrorMessage(error);
      console.warn(`Model ${modelName} failed with: ${formatted}. Trying fallback candidate...`);

      if (i < candidateModels.length - 1) {
        await wait(1200);
      }
    }
  }

  throw new Error(formatGeminiErrorMessage(lastError));
}
