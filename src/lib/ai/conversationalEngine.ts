/**
 * Saberio AI - Conversational Follow-Up Engine
 * Implements Phase 7: Context-aware follow-up reasoning for Question Solver and AI Tutor.
 * Understands active questions, previously generated answers, and focused student queries.
 */

import { executeModelWithOrchestration } from './modelOrchestrator';
import { Type, Schema } from '@google/genai';
import { sanitizeLatexAndSymbols } from '@/lib/pdfBranding';

export interface FollowUpRequest {
  questionNumber?: string;
  originalQuestion: string;
  originalAnswer: string;
  followUpPrompt: string;
  subject?: string;
  academicLevel?: string;
  apiKey?: string;
  preferredModel?: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export interface FollowUpResponse {
  answer: string;
  suggestedFollowUps: string[];
  diagramMermaid?: string;
}

const followUpSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    answer: {
      type: Type.STRING,
      description: 'The targeted, context-aware answer addressing the student\'s follow-up request in clean Markdown without raw LaTeX.',
    },
    suggestedFollowUps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2 to 3 logical next follow-up questions the student might ask.',
    },
    diagramMermaid: {
      type: Type.STRING,
      description: 'Optional Mermaid diagram code if the student asked to visualize or explain the architecture/flowchart.',
    },
  },
  required: ['answer', 'suggestedFollowUps'],
};

/**
 * Solves a contextual follow-up question regarding an existing exam solution.
 */
export async function processSolutionFollowUp(
  request: FollowUpRequest
): Promise<FollowUpResponse> {
  const {
    originalQuestion,
    originalAnswer,
    followUpPrompt,
    subject = 'University Examination',
    academicLevel = 'Undergraduate',
    apiKey,
    preferredModel,
    history = [],
  } = request;

  const systemInstruction = `You are a dedicated University Academic Tutor and Subject Matter Expert in "${subject}" (${academicLevel}).
A student is currently studying an examination model solution and has asked a specific follow-up question.

YOUR INSTRUCTIONS:
1. Address the student's follow-up question directly and pedagogically.
2. Rely on the context of the ORIGINAL QUESTION and ORIGINAL MODEL SOLUTION provided below.
3. NEVER make the student repeat context that was already stated.
4. Adapt intelligently to their goal:
   - If they ask to "simplify": Break down complex jargon into intuitive everyday analogies without losing technical truth.
   - If they ask for "another practical example": Provide a vivid, real-world industrial or software implementation (e.g. Linux kernel, Google Spanner, Redis).
   - If they ask to "convert marks": Calibrate the answer directly to the requested mark length (e.g. 5 marks = 110-150 words with 3-4 structured points; 2 marks = 40-60 words with direct definition & example).
   - If they ask to "explain the diagram": Walk through components, data flows, and state transitions step by step.
5. Use exact mathematical and Greek symbols directly (Σ, ε, λ, δ, ∈, ∉, ∅, →). Do not use raw LaTeX math dollar tags.
6. Return your response adhering to the JSON schema.`;

  let prompt = `ORIGINAL EXAM QUESTION:
"""
${originalQuestion}
"""

ORIGINAL MODEL SOLUTION:
"""
${originalAnswer.slice(0, 4000)}
"""

`;

  if (history.length > 0) {
    prompt += `PREVIOUS FOLLOW-UP CONTEXT:\n`;
    const recentTurns = history.slice(-4);
    for (const turn of recentTurns) {
      prompt += `${turn.role === 'user' ? 'Student' : 'Tutor'}: ${turn.text}\n`;
    }
    prompt += '\n';
  }

  prompt += `STUDENT'S NEW FOLLOW-UP REQUEST:
"""
${followUpPrompt}
"""

Provide a targeted, authoritative pedagogical response.`;

  const contents = [{ role: 'user', parts: [{ text: prompt }] }];

  const result = await executeModelWithOrchestration(contents, {
    apiKey,
    preferredModel,
    systemInstruction,
    responseSchema: followUpSchema,
    responseMimeType: 'application/json',
    temperature: 0.25,
  });

  try {
    const parsed = JSON.parse(result.text);
    return {
      answer: sanitizeLatexAndSymbols(parsed.answer || ''),
      suggestedFollowUps: parsed.suggestedFollowUps || [],
      diagramMermaid: parsed.diagramMermaid || undefined,
    };
  } catch (err) {
    return {
      answer: sanitizeLatexAndSymbols(result.text),
      suggestedFollowUps: [
        'Explain this with a practical example',
        'Summarize in 3 bullet points for an exam',
      ],
    };
  }
}
