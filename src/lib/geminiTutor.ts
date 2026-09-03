import { GoogleGenAI } from '@google/genai';
import {
  TutorChatRequest,
  TutorContext,
  TutorExplanationMode,
  TutorLearningMode,
  TutorMessage,
  TutorSuggestedAction,
} from '@/types';
import { formatGeminiErrorMessage } from './gemini';

// Candidate models in order of stability and performance
const TUTOR_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-pro',
];

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Builds the personalized system instruction for the AI Tutor based on student context and modes
 */
export function buildTutorSystemInstruction(params: {
  context?: TutorContext;
  explanationMode?: TutorExplanationMode;
  learningMode?: TutorLearningMode;
}): string {
  const explanationMode = params.explanationMode || 'simple';
  const learningMode = params.learningMode || 'direct';
  const ctx = params.context;

  let modeInstruction = '';
  switch (explanationMode) {
    case 'simple':
      modeInstruction = `EXPLANATION MODE: [Simple / Beginner]
- Explain concepts using everyday analogies and plain, accessible language.
- Keep sentences concise. Avoid jargon unless clearly defined first.
- Progressively build intuition from zero background knowledge.`;
      break;
    case 'detailed':
      modeInstruction = `EXPLANATION MODE: [Detailed & Rigorous]
- Provide an in-depth, academically comprehensive breakdown with technical rigor.
- Explain the foundational mechanisms, theoretical trade-offs, and mathematical/scientific principles.
- Include formal terminology, definitions, and nuances.`;
      break;
    case 'step_by_step':
      modeInstruction = `EXPLANATION MODE: [Step-by-Step Problem Solving]
- Structure your response using sequential, labeled steps:
  1. Understand the Problem: Clarify what is given and what must be found.
  2. Core Concept & Formula: State the relevant formula, theorem, or law.
  3. Step-by-Step Execution: Walk through every calculation or deduction clearly without skipping steps.
  4. Final Answer: Highlight the final result.
  5. Sanity Check / Verification: Quick check why this result is logical.
  6. Practice Check: Provide a 1-sentence similar problem to try.`;
      break;
    case 'example':
      modeInstruction = `EXPLANATION MODE: [Practical Examples & Analogies]
- Center the explanation around 2-3 vivid real-world scenarios, concrete applications, or tangible metaphors.
- Connect abstract concepts to things students encounter in everyday life or industrial applications.`;
      break;
    case 'exam':
      modeInstruction = `EXPLANATION MODE: [Exam & High-Yield Strategy]
- Highlight key criteria examiners look for to award full marks.
- Bold essential keywords, formulas, and definitions that must appear on an exam paper.
- Call out common student pitfalls, misconceptions, and edge cases.`;
      break;
  }

  let socraticInstruction = '';
  if (learningMode === 'socratic') {
    socraticInstruction = `SOCRATIC LEARNING MODE ACTIVATED:
- DO NOT immediately dump the full answer or completed solution!
- Instead, act as an empathetic, guiding tutor. Ask 1-2 targeted scaffolding questions that help the student discover the answer themselves.
- Praise correct intuition, gently correct false assumptions, and guide the student forward step-by-step.
- If the student explicitly types "Show solution" or "I give up", provide the full explanation warmly.`;
  } else {
    socraticInstruction = `DIRECT LEARNING MODE:
- Provide clear, direct, and comprehensive explanations immediately.
- Always end with a helpful next step or offer a practice question.`;
  }

  let contextInstruction = '';
  if (ctx) {
    contextInstruction = `STUDENT'S ACTIVE STUDY CONTEXT:
`;

    if (ctx.lectureTitle) {
      contextInstruction += `- Lecture / Video: "${ctx.lectureTitle}" ${ctx.timestampFormatted ? `at [${ctx.timestampFormatted}]` : ''}\n`;
    }
    if (ctx.relevantTranscriptSnippet) {
      contextInstruction += `- Relevant Lecture Transcript Excerpt:\n"""\n${ctx.relevantTranscriptSnippet.slice(0, 3000)}\n"""\n`;
    }
    if (ctx.notesOrCheatsheetSnippet) {
      contextInstruction += `- Active Notes / Cheatsheet Reference:\n"""\n${ctx.notesOrCheatsheetSnippet.slice(0, 3000)}\n"""\n`;
    }
    if (ctx.questionText) {
      contextInstruction += `- Current Quiz Question: "${ctx.questionText}"\n`;
      if (ctx.options && ctx.options.length > 0) {
        contextInstruction += `- Options: ${ctx.options.map((opt, i) => `[${i + 1}] ${opt}`).join(', ')}\n`;
      }
      if (ctx.studentSelectedAnswer) {
        contextInstruction += `- Student's Selected Answer: "${ctx.studentSelectedAnswer}"\n`;
      }
      if (ctx.correctAnswer) {
        contextInstruction += `- Correct Answer: "${ctx.correctAnswer}"\n`;
      }
      if (ctx.explanation) {
        contextInstruction += `- Reference Explanation: "${ctx.explanation}"\n`;
      }
    }
    if (ctx.type === 'mistake') {
      contextInstruction += `
SPECIAL "EXPLAIN MY MISTAKE" INSTRUCTION:
- The student selected the incorrect answer: "${ctx.studentSelectedAnswer || 'an incorrect option'}".
- Analyze WHY the student made this mistake (e.g. confusing concept A with B, sign error, misreading condition).
- Explain why the student's answer is incorrect.
- Explain why the correct answer is right.
- Provide a similar mini-problem for the student to verify they now understand!
`;
    }

    contextInstruction += `
CONTEXT GROUNDING RULES:
1. When answering questions related to this lecture/topic, explicitly prioritize the material from the student's lecture. Say "Based on your lecture..." when referencing lecture material.
2. If the student asks something NOT in the lecture context, clearly state: "I couldn't find this specific detail in your lecture, but here is the explanation from general knowledge:"
3. NEVER hallucinate facts or pretend they were in the student's lecture if they were not.`;
  }

  return `You are QuizTube AI Tutor — an elite, encouraging, and pedagogically master personal tutor built directly into QuizTube AI.

CORE PHILOSOPHY:
- Your purpose is to help students truly UNDERSTAND, not just memorize.
- Be supportive, clear, concise, and structured.
- Use GitHub Flavored Markdown (headings, bullet points, bold key terms, KaTeX math blocks $$...$$ or \\(...\\), and syntax-highlighted code blocks).

${modeInstruction}

${socraticInstruction}

${contextInstruction}

CODE QUESTIONS:
If asked about programming or code bugs:
1. Diagnose the problem clearly.
2. Explain WHY the bug occurs.
3. Show clean, corrected code with comments.
4. Highlight what key takeaway the student should remember.

END OF RESPONSE PROTOCOL:
At the very end of your response, you MUST include a structured JSON block on its own line wrapped in special tags <<<SUGGESTIONS_JSON>>>...<<<END_SUGGESTIONS_JSON>>> containing:
1. 2-3 contextual follow-up questions the student might want to ask next.
2. 2-3 recommended action buttons (e.g., practice, flashcards, simplify, example).

Example format:
<<<SUGGESTIONS_JSON>>>
{
  "followUpQuestions": ["Why does this happen?", "Can you show another example?", "How is this tested in exams?"],
  "suggestedActions": [
    { "label": "Practice Similar Question", "action": "practice", "topic": "Current Topic" },
    { "label": "Create Flashcards", "action": "flashcards", "topic": "Current Topic" },
    { "label": "Explain Simpler", "action": "simplify" },
    { "label": "Give Real Example", "action": "example" }
  ]
}
<<<END_SUGGESTIONS_JSON>>>
`;
}

/**
 * Extracts and cleans the AI message text and suggestion metadata from the raw model response
 */
export function parseTutorResponse(rawText: string): {
  cleanContent: string;
  followUpQuestions: string[];
  suggestedActions: TutorSuggestedAction[];
} {
  let cleanContent = rawText;
  let followUpQuestions: string[] = [];
  let suggestedActions: TutorSuggestedAction[] = [
    { label: 'Practice This Topic', action: 'practice' },
    { label: 'Create Flashcards', action: 'flashcards' },
    { label: 'Explain Simpler', action: 'simplify' },
    { label: 'Give Real Example', action: 'example' },
  ];

  const match = rawText.match(/<<<SUGGESTIONS_JSON>>>([\s\S]*?)<<<END_SUGGESTIONS_JSON>>>/);

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed.followUpQuestions)) {
        followUpQuestions = parsed.followUpQuestions.filter((q: any) => typeof q === 'string');
      }
      if (Array.isArray(parsed.suggestedActions)) {
        suggestedActions = parsed.suggestedActions.filter((a: any) => a && a.label && a.action);
      }
    } catch (err) {
      console.warn('Could not parse tutor suggestions JSON:', err);
    }
    cleanContent = rawText.replace(/<<<SUGGESTIONS_JSON>>>[\s\S]*?<<<END_SUGGESTIONS_JSON>>>/, '').trim();
  }

  // If no follow ups found, generate helpful defaults
  if (followUpQuestions.length === 0) {
    followUpQuestions = [
      'Can you explain this with a simpler analogy?',
      'How would an exam test this concept?',
      'Give me a step-by-step practice problem.',
    ];
  }

  return {
    cleanContent,
    followUpQuestions,
    suggestedActions,
  };
}

/**
 * Main function to interact with Gemini for AI Tutor
 */
export async function generateTutorResponse(request: TutorChatRequest): Promise<TutorMessage> {
  const apiKey = request.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Gemini API key is required. Please set GEMINI_API_KEY in your environment or provide it in the app settings.'
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = buildTutorSystemInstruction({
    context: request.context,
    explanationMode: request.explanationMode,
    learningMode: request.learningMode,
  });

  // Prepare contents array for multi-turn chat
  const contents: any[] = [];

  // Add conversation history
  const recentMessages = request.messages.slice(-10); // Keep last 10 turns to conserve tokens & focus

  for (let i = 0; i < recentMessages.length; i++) {
    const msg = recentMessages[i];
    const isLatest = i === recentMessages.length - 1;

    // If it's the latest user message and has an image attachment
    if (isLatest && msg.role === 'user' && request.imageFileBase64 && request.imageMimeType) {
      const base64Data = request.imageFileBase64.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: request.imageMimeType,
            },
          },
          {
            text: msg.content || 'Please analyze this problem/question image and teach me how to solve it step-by-step.',
          },
        ],
      });
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  // Model candidate pipeline
  const candidateModels = request.preferredModel
    ? [request.preferredModel, ...TUTOR_FALLBACK_MODELS.filter(m => m !== request.preferredModel)]
    : TUTOR_FALLBACK_MODELS;

  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const modelName = candidateModels[i];
    try {
      console.log(`AI Tutor generating response with model: ${modelName} (attempt ${i + 1}/${candidateModels.length})`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: request.learningMode === 'socratic' ? 0.35 : 0.25,
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error(`Model ${modelName} returned an empty response.`);
      }

      const { cleanContent, followUpQuestions, suggestedActions } = parseTutorResponse(rawText);

      return {
        id: `tutor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'assistant',
        content: cleanContent,
        createdAt: new Date().toISOString(),
        suggestedActions,
        followUpQuestions,
        isSocratic: request.learningMode === 'socratic',
        explanationMode: request.explanationMode,
        sourceContextUsed: Boolean(request.context?.lectureTitle || request.context?.questionText),
      };
    } catch (error: any) {
      lastError = error;
      const formatted = formatGeminiErrorMessage(error);
      console.warn(`Tutor model ${modelName} failed with: ${formatted}. Trying fallback...`);

      if (i < candidateModels.length - 1) {
        await wait(1000);
      }
    }
  }

  throw new Error(formatGeminiErrorMessage(lastError));
}
