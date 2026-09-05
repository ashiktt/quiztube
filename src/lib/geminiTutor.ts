import { GoogleGenAI } from '@google/genai';
import {
  TutorChatRequest,
  TutorContext,
  TutorExplanationMode,
  TutorLearningMode,
  TutorMessage,
} from '@/types';
import { formatGeminiErrorMessage } from './gemini';
import { parseModelTutorOutput } from './tutorResponseParser';

// Candidate models in order of stability and speed
const TUTOR_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-pro-preview',
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
      modeInstruction = `EXPLANATION LEVEL: [Simple / Intuitive / Beginner]
- Explain concepts using everyday analogies and crystal-clear plain language.
- Keep sentences concise. Avoid jargon unless immediately unpacked.
- Progressively build intuition from zero prior knowledge.`;
      break;
    case 'detailed':
      modeInstruction = `EXPLANATION LEVEL: [Detailed & Academically Rigorous]
- Provide an in-depth breakdown covering foundational mechanisms, theoretical trade-offs, and formal nuances.
- Include precise definitions, standards, and mathematical/scientific principles.`;
      break;
    case 'step_by_step':
      modeInstruction = `EXPLANATION LEVEL: [Methodical Step-by-Step]
- Break down the solution or mechanism into sequential, logical steps.
- Show each intermediate transition clearly.`;
      break;
    case 'example':
      modeInstruction = `EXPLANATION LEVEL: [Practical Examples & Analogies]
- Anchor the explanation in vivid real-world scenarios, concrete applications, or tangible metaphors.`;
      break;
    case 'exam':
      modeInstruction = `EXPLANATION LEVEL: [Exam & High-Yield Strategy]
- Highlight key criteria examiners look for, key formulas, common traps, and memory hooks.`;
      break;
  }

  let socraticInstruction = '';
  if (learningMode === 'socratic') {
    socraticInstruction = `SOCRATIC TEACHING MODE ACTIVATED:
- DO NOT reveal the complete final answer immediately!
- Ask 1-2 scaffold guiding questions that lead the student to discover the answer themselves.
- Praise valid intuition, gently question faulty assumptions, and guide the student forward.
- If the student explicitly says "Show solution" or "I give up", provide the full explanation warmly.`;
  } else {
    socraticInstruction = `DIRECT TEACHING MODE:
- Deliver clear, direct, and pedagogically rich explanations immediately.`;
  }

  let contextInstruction = '';
  if (ctx) {
    contextInstruction = `STUDENT ACTIVE STUDY CONTEXT:
`;
    if (ctx.lectureTitle) {
      contextInstruction += `- Lecture Video: "${ctx.lectureTitle}" ${ctx.timestampFormatted ? `at [${ctx.timestampFormatted}]` : ''}\n`;
    }
    if (ctx.relevantTranscriptSnippet) {
      contextInstruction += `- Relevant Lecture Transcript Excerpt:\n"""\n${ctx.relevantTranscriptSnippet.slice(0, 3000)}\n"""\n`;
    }
    if (ctx.notesOrCheatsheetSnippet) {
      contextInstruction += `- Active Notes / Cheatsheet Reference:\n"""\n${ctx.notesOrCheatsheetSnippet.slice(0, 3000)}\n"""\n`;
    }
    if (ctx.questionText) {
      contextInstruction += `- Quiz Question: "${ctx.questionText}"\n`;
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
- Student's Answer was: "${ctx.studentSelectedAnswer || 'an incorrect option'}".
- Correct Answer is: "${ctx.correctAnswer || 'correct option'}".
- You MUST populate the "mistakeAnalysis" object in the JSON response with whatWentWrong, why, and howToRemember!
`;
    }
  }

  return `You are Saberio AI Tutor — an elite, encouraging, and pedagogically master AI teacher built into Saberio AI.

YOUR TEACHING PHILOSOPHY:
QUESTION -> UNDERSTAND INTENT -> IDENTIFY DIFFICULTY -> CHOOSE BEST TEACHING METHOD -> EXPLAIN -> VISUALIZE WHEN USEFUL -> GIVE EXAMPLE -> PRACTICE QUESTION.
- Do NOT generate giant walls of raw unformatted Markdown!
- Do NOT output raw formatting characters like ###, **, *, or > on screen.
- You MUST respond ONLY with a single valid JSON object following the schema below.

${modeInstruction}

${socraticInstruction}

${contextInstruction}

SUPPORTED RESPONSE TYPES (classify internally):
"concept" | "process" | "comparison" | "algorithm" | "mathematics" | "physics" | "chemistry" | "biology" | "computer_science" | "programming" | "history" | "geography" | "exam_question" | "definition" | "general"

VISUAL RULES:
- If a visual genuinely improves understanding, include a structured "visual" object!
- Never add visuals for pure decoration. Accuracy is more important than visual complexity.
- "What is RAM?" -> visual.type: "none" (concise explanation).
- "Explain the OSI model." -> visual.type: "hierarchy" with 7 layers (Application down to Physical, with names, shortDesc, protocols, and details).
- "How does Dijkstra's algorithm work?" -> visual.type: "step_sequence" (and network graph data) with 4 nodes A, B, C, D and edge costs, showing initial distances and step-by-step path calculation.
- "What is the difference between TCP and UDP?" -> visual.type: "comparison_table" with headers and rows.
- "Explain photosynthesis." -> visual.type: "process_diagram" with diagramNodes and diagramEdges.
- "Solve this equation / math problem" -> visual.type: "formula_breakdown" or "step_sequence".
- "Explain recursion / sorting / binary search" -> visual.type: "step_sequence" or "code_flow".
- "World War II" -> visual.type: "timeline" with key dates and events.

JSON SCHEMA TO RETURN (RETURN ONLY VALID JSON):
{
  "title": "Clear educational title",
  "responseType": "concept | process | comparison | algorithm | mathematics | physics | chemistry | biology | computer_science | programming | history | geography | exam_question | definition | general",
  "difficulty": "beginner | intermediate | advanced",
  "summary": "1 to 3 concise sentences giving direct intuition",
  "visual": {
    "type": "flowchart | process_diagram | concept_map | timeline | comparison_table | hierarchy | network_graph | architecture_diagram | formula_breakdown | step_sequence | code_flow | none",
    "title": "Visual Title",
    "hierarchyLayers": [
      { "layerNumber": 7, "name": "Application Layer", "shortDesc": "User interface & network services", "protocolsOrExamples": ["HTTP", "DNS", "FTP", "SMTP"], "details": "Interacts directly with software applications." }
    ],
    "comparisonTable": {
      "headers": ["Feature", "Option A", "Option B"],
      "rows": [
        { "feature": "Connection Type", "values": ["Connection-oriented", "Connectionless"], "highlight": true }
      ],
      "summaryTakeaway": "Choose TCP when reliability is critical; choose UDP when speed and low latency matter."
    },
    "timelineEvents": [
      { "dateOrPeriod": "1939", "title": "Invasion of Poland", "description": "Beginning of World War II in Europe.", "significance": "Triggers declarations of war." }
    ],
    "formulaBreakdown": {
      "formula": "F = m * a",
      "name": "Newton's Second Law",
      "purpose": "Relates net force, mass, and acceleration.",
      "variables": [
        { "symbol": "F", "meaning": "Net Force", "unit": "Newtons (N)" },
        { "symbol": "m", "meaning": "Mass", "unit": "Kilograms (kg)" },
        { "symbol": "a", "meaning": "Acceleration", "unit": "m/s²" }
      ]
    },
    "stepSequence": [
      { "stepNumber": 1, "title": "Start at Node A", "action": "Initialize distances", "stateOrData": "Distances: A=0, B=4, C=2, D=∞", "explanation": "Mark A as visited and evaluate neighbors B and C." },
      { "stepNumber": 2, "title": "Expand Smallest (Node C)", "action": "Visit Node C (cost 2)", "stateOrData": "Distances: A=0, B=4, C=2, D=5 (via C)", "explanation": "2 is smaller than 4, so C is visited next." }
    ],
    "diagramNodes": [
      { "id": "A", "label": "Node A (Start)" },
      { "id": "B", "label": "Node B" },
      { "id": "C", "label": "Node C" },
      { "id": "D", "label": "Node D (End)" }
    ],
    "diagramEdges": [
      { "from": "A", "to": "B", "costOrWeight": "4" },
      { "from": "A", "to": "C", "costOrWeight": "2" },
      { "from": "C", "to": "D", "costOrWeight": "3" },
      { "from": "B", "to": "D", "costOrWeight": "1" }
    ],
    "codeFlow": {
      "language": "python",
      "code": "def binary_search(arr, target):\\n    low, high = 0, len(arr) - 1\\n    while low <= high:\\n        mid = (low + high) // 2\\n        if arr[mid] == target: return mid\\n        elif arr[mid] < target: low = mid + 1\\n        else: high = mid - 1\\n    return -1",
      "executionSteps": [
        { "lineOrStep": 1, "description": "Set low=0 and high=len-1", "variableState": "low=0, high=5" }
      ]
    }
  },
  "sections": [
    {
      "type": "explanation",
      "title": "How It Works",
      "content": "Clear, accessible explanation of the mechanism."
    }
  ],
  "example": {
    "title": "Real-World Example",
    "scenario": "A clear, tangible analogy or use-case",
    "walkthrough": "How the concept applies to this scenario"
  },
  "mistakeAnalysis": {
    "studentAnswer": "...",
    "correctAnswer": "...",
    "whatWentWrong": "...",
    "why": "...",
    "howToRemember": "..."
  },
  "practiceQuestion": {
    "question": "A concise test question to check understanding",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctOptionIndex": 0,
    "hint": "Think about what connects the input and output.",
    "explanation": "Why this option is correct."
  },
  "actions": [
    "explain_simpler",
    "show_example",
    "test_me",
    "guide_me",
    "try_similar",
    "generate_quiz"
  ],
  "followUpQuestions": [
    "Would you like an example with numbers?",
    "How does this relate to other topics?"
  ]
}

REMEMBER: Return ONLY the JSON object. Do NOT add commentary outside the JSON.`;
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
  const recentMessages = request.messages.slice(-8); // Keep last 8 turns for focused pedagogical context

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
      console.log(`Saberio AI Tutor generating response with model: ${modelName} (attempt ${i + 1}/${candidateModels.length})`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: request.learningMode === 'socratic' ? 0.35 : 0.25,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error(`Model ${modelName} returned an empty response.`);
      }

      // Parse structured pedagogical output safely
      const latestUserPrompt = request.messages[request.messages.length - 1]?.content || 'Study Explanation';
      const { structured, cleanContent, followUpQuestions, suggestedActions } = parseModelTutorOutput(rawText, latestUserPrompt);

      return {
        id: `tutor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'assistant',
        content: cleanContent,
        structured,
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
