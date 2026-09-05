import {
  TutorStructuredResponse,
  TutorResponseType,
  TutorVisualType,
  TutorSuggestedAction,
  TutorSection,
} from '@/types';

/**
 * Cleans markdown formatting characters from titles or plain text labels
 */
export function cleanTextSymbols(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s*/gm, '') // Remove heading hashes
    .replace(/^\s*>\s*/gm, '') // Remove blockquote markers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Strip bold
    .replace(/\*(.*?)\*/g, '$1') // Strip italic
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/^[-*+]\s+/gm, '') // Strip bullet prefixes
    .trim();
}

/**
 * Infers an appropriate response type from topic keywords
 */
export function inferResponseType(text: string): TutorResponseType {
  const lower = text.toLowerCase();
  if (lower.includes('dijkstra') || lower.includes('algorithm') || lower.includes('binary search') || lower.includes('sort') || lower.includes('traversal')) {
    return 'algorithm';
  }
  if (lower.includes('osi') || lower.includes('tcp') || lower.includes('udp') || lower.includes('network') || lower.includes('protocol') || lower.includes('ip address') || lower.includes('router') || lower.includes('packet') || lower.includes('memory') || lower.includes('thread') || lower.includes('ram') || lower.includes('cpu') || lower.includes('cache') || lower.includes('operating system')) {
    return 'computer_science';
  }
  if (lower.includes('solve') || lower.includes('equation') || lower.includes('integral') || lower.includes('derivative') || lower.includes('algebra') || lower.includes('calculus') || lower.includes('matrix')) {
    return 'mathematics';
  }
  if (lower.includes('force') || lower.includes('velocity') || lower.includes('acceleration') || lower.includes('gravity') || lower.includes('physics') || lower.includes('kinetic') || lower.includes('thermodynamics')) {
    return 'physics';
  }
  if (lower.includes('photosynthesis') || lower.includes('cell') || lower.includes('dna') || lower.includes('biology') || lower.includes('organism') || lower.includes('mitochondria')) {
    return 'biology';
  }
  if (lower.includes('reaction') || lower.includes('molecule') || lower.includes('acid') || lower.includes('base') || lower.includes('chemistry') || lower.includes('bond')) {
    return 'chemistry';
  }
  if (lower.includes('code') || lower.includes('function') || lower.includes('python') || lower.includes('javascript') || lower.includes('class') || lower.includes('recursion') || lower.includes('loop')) {
    return 'programming';
  }
  if (lower.includes('world war') || lower.includes('history') || lower.includes('century') || lower.includes('revolution') || lower.includes('treaty') || lower.includes('empire')) {
    return 'history';
  }
  if (lower.includes('difference between') || lower.includes('vs') || lower.includes('compare') || lower.includes('comparison')) {
    return 'comparison';
  }
  if (lower.includes('how does') || lower.includes('step') || lower.includes('process') || lower.includes('cycle')) {
    return 'process';
  }
  if (lower.includes('what is') || lower.includes('define') || lower.includes('definition') || lower.includes('meaning of')) {
    return 'definition';
  }
  return 'concept';
}

/**
 * Parses raw markdown text into a clean structured response when JSON is unavailable
 */
export function convertMarkdownToStructured(rawText: string, defaultTitle: string = 'Explanation'): TutorStructuredResponse {
  const lines = rawText.split('\n');
  let title = defaultTitle;
  let summary = '';
  const sections: TutorSection[] = [];
  let currentSectionTitle = 'Core Explanation';
  let currentLines: string[] = [];
  let keyTakeaway = '';
  let exampleScenario = '';
  let exampleWalkthrough = '';

  const flushCurrentSection = () => {
    if (currentLines.length > 0) {
      const content = currentLines.join('\n').trim();
      if (content) {
        // Detect if this section is key takeaway
        const lowerTitle = currentSectionTitle.toLowerCase();
        if (lowerTitle.includes('takeaway') || lowerTitle.includes('key idea') || lowerTitle.includes('summary')) {
          keyTakeaway = cleanTextSymbols(content);
        } else if (lowerTitle.includes('example') || lowerTitle.includes('scenario')) {
          exampleScenario = currentSectionTitle;
          exampleWalkthrough = content;
        } else {
          sections.push({
            type: 'explanation',
            title: currentSectionTitle,
            content,
          });
        }
      }
      currentLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for title heading
    if (/^#\s+/.test(trimmed) && title === defaultTitle) {
      title = cleanTextSymbols(trimmed);
      continue;
    }

    // Check for section headings ## or ###
    if (/^#{2,4}\s+/.test(trimmed)) {
      flushCurrentSection();
      currentSectionTitle = cleanTextSymbols(trimmed);
      continue;
    }

    // Capture first short sentence/paragraph as summary if empty
    if (!summary && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
      summary = cleanTextSymbols(trimmed);
      continue;
    }

    currentLines.push(line);
  }

  flushCurrentSection();

  // If no sections were extracted, fallback to entire raw text
  if (sections.length === 0 && !summary) {
    summary = rawText.slice(0, 180);
    sections.push({
      type: 'explanation',
      title: 'Explanation',
      content: rawText,
    });
  }

  const responseType = inferResponseType(title + ' ' + summary);

  return {
    title: title || 'Concept Explanation',
    responseType,
    difficulty: 'beginner',
    summary: summary || 'Here is the step-by-step educational breakdown.',
    sections,
    example: exampleWalkthrough
      ? {
          title: exampleScenario || 'Practical Example',
          scenario: 'Real-world application',
          walkthrough: exampleWalkthrough,
        }
      : undefined,
    actions: ['explain_simpler', 'show_example', 'test_me', 'generate_quiz'],
    followUpQuestions: [
      'Can you explain this with a simpler analogy?',
      'Can you show another practical example?',
      'How does this apply in exams or real life?',
    ],
  };
}

/**
 * Validates and normalizes parsed JSON into TutorStructuredResponse
 */
export function normalizeStructuredResponse(parsed: any, fallbackTitle?: string): TutorStructuredResponse {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed response is not an object.');
  }

  const title = typeof parsed.title === 'string' && parsed.title.trim()
    ? cleanTextSymbols(parsed.title)
    : fallbackTitle || 'Study Explanation';

  const validTypes: TutorResponseType[] = [
    'concept', 'process', 'comparison', 'algorithm', 'mathematics',
    'physics', 'chemistry', 'biology', 'computer_science', 'programming',
    'history', 'geography', 'exam_question', 'definition', 'general'
  ];
  const responseType: TutorResponseType = validTypes.includes(parsed.responseType)
    ? parsed.responseType
    : inferResponseType(title + ' ' + (parsed.summary || ''));

  const validDifficulties = ['beginner', 'intermediate', 'advanced'] as const;
  const difficulty = validDifficulties.includes(parsed.difficulty)
    ? parsed.difficulty
    : 'beginner';

  const summary = typeof parsed.summary === 'string'
    ? parsed.summary.trim()
    : 'Educational breakdown and key insights:';

  // Normalize sections
  const sections: TutorSection[] = Array.isArray(parsed.sections)
    ? parsed.sections.map((s: any) => ({
        type: s.type || 'explanation',
        title: s.title ? cleanTextSymbols(s.title) : undefined,
        content: typeof s.content === 'string' ? s.content : '',
        items: Array.isArray(s.items) ? s.items : undefined,
      }))
    : [];

  // Normalize visual
  let visual = parsed.visual && typeof parsed.visual === 'object' ? parsed.visual : undefined;
  if (visual) {
    const validVisualTypes: TutorVisualType[] = [
      'flowchart', 'process_diagram', 'concept_map', 'timeline',
      'comparison_table', 'hierarchy', 'network_graph', 'architecture_diagram',
      'formula_breakdown', 'step_sequence', 'code_flow', 'none'
    ];
    if (!validVisualTypes.includes(visual.type)) {
      visual.type = 'none';
    }
  }

  // Normalize actions
  const actions = Array.isArray(parsed.actions) && parsed.actions.length > 0
    ? parsed.actions
    : ['explain_simpler', 'show_example', 'test_me', 'generate_quiz'];

  // Normalize follow-up questions
  const followUpQuestions = Array.isArray(parsed.followUpQuestions) && parsed.followUpQuestions.length > 0
    ? parsed.followUpQuestions.filter((q: any) => typeof q === 'string')
    : [
        'Can you give me a real-world example?',
        'How would this appear on an exam?',
        'Explain this in simpler terms.',
      ];

  return {
    title,
    responseType,
    difficulty,
    summary,
    visual,
    sections,
    example: parsed.example,
    mistakeAnalysis: parsed.mistakeAnalysis,
    practiceQuestion: parsed.practiceQuestion,
    actions,
    followUpQuestions,
  };
}

/**
 * Master parser: Takes raw model response, safely parses structured JSON,
 * or gracefully constructs structured objects via fallback parser.
 */
export function parseModelTutorOutput(rawText: string, contextPrompt?: string): {
  structured: TutorStructuredResponse;
  cleanContent: string;
  followUpQuestions: string[];
  suggestedActions: TutorSuggestedAction[];
} {
  let jsonString = '';
  let fallbackText = rawText;

  // 1. Check for wrapped JSON code blocks ```json ... ```
  const jsonBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    jsonString = jsonBlockMatch[1].trim();
  } else {
    // 2. Check for root level JSON object { ... }
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = rawText.slice(firstBrace, lastBrace + 1).trim();
    }
  }

  let structured: TutorStructuredResponse | null = null;

  if (jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      structured = normalizeStructuredResponse(parsed);
    } catch (err) {
      console.warn('Direct JSON parse failed, trying relaxed normalization:', err);
    }
  }

  // If JSON parsing succeeded
  if (structured) {
    const suggestedActions: TutorSuggestedAction[] = (structured.actions || []).map(actionKey => {
      switch (actionKey) {
        case 'explain_simpler':
          return { label: 'Explain Simpler', action: 'simplify' };
        case 'show_example':
          return { label: 'Show Example', action: 'example' };
        case 'test_me':
          return { label: 'Test My Understanding', action: 'practice' };
        case 'guide_me':
          return { label: 'Guide Me (Socratic)', action: 'socratic' };
        case 'try_similar':
          return { label: 'Try Similar Problem', action: 'similar' };
        case 'show_solution':
          return { label: 'Show Full Solution', action: 'solution' };
        case 'show_diagram':
          return { label: 'Show Visual Diagram', action: 'diagram' };
        case 'generate_quiz':
          return { label: 'Generate Quiz', action: 'practice' };
        case 'create_flashcards':
          return { label: 'Create Flashcards', action: 'flashcards' };
        default:
          return { label: cleanTextSymbols(actionKey), action: 'practice' };
      }
    });

    return {
      structured,
      cleanContent: structured.summary,
      followUpQuestions: structured.followUpQuestions || [],
      suggestedActions,
    };
  }

  // 3. Fallback: Parse raw Markdown into structured response
  const fallbackStructured = convertMarkdownToStructured(fallbackText, contextPrompt || 'Study Explanation');
  const suggestedActions: TutorSuggestedAction[] = [
    { label: 'Explain Simpler', action: 'simplify' },
    { label: 'Show Example', action: 'example' },
    { label: 'Test My Understanding', action: 'practice' },
    { label: 'Generate Quiz', action: 'practice' },
  ];

  return {
    structured: fallbackStructured,
    cleanContent: fallbackStructured.summary,
    followUpQuestions: fallbackStructured.followUpQuestions || [],
    suggestedActions,
  };
}
