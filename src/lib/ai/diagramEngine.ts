/**
 * Saberio AI - Smart Diagram Engine
 * Implements Phase 5: Selective Mermaid diagram generation, syntax sanitization,
 * node quoting, and validation for Web & PDF rendering.
 */

import { QuestionCategory } from './reasoningEngine';

export interface MermaidValidationResult {
  isValid: boolean;
  cleanedCode?: string;
  error?: string;
  diagramType?: string;
}

const SUPPORTED_DIAGRAM_PREFIXES = [
  'flowchart',
  'graph',
  'sequencediagram',
  'classdiagram',
  'statediagram',
  'statediagram-v2',
  'erdiagram',
  'journey',
  'gantt',
  'pie',
  'gitgraph',
  'mindmap',
  'timeline',
];

/**
 * Determines whether a question genuinely warrants a Mermaid diagram,
 * preventing superficial diagrams for simple definitions or pure calculations.
 */
export function shouldIncludeDiagram(
  category: QuestionCategory,
  marks: number,
  questionText: string
): boolean {
  const lower = (questionText || '').toLowerCase();

  // Always include if explicitly requested in the question prompt
  if (/\b(draw|diagram|flowchart|sketch|neat sketch|architecture|schematic|state machine|automaton)\b/i.test(lower)) {
    return true;
  }

  // Never generate diagrams for simple low-mark definitions or numerical calculations
  if (marks <= 3) return false;
  if (category === 'numerical' || category === 'definition') return false;

  // Highly recommended for architecture, algorithm, and case studies with >= 5 marks
  if (category === 'architecture' || category === 'diagram_based') return true;
  if ((category === 'algorithm' || category === 'case_study' || category === 'theoretical') && marks >= 8) {
    return true;
  }

  return false;
}

/**
 * Validates, cleans, and auto-corrects Mermaid diagram syntax.
 * Solves common LLM diagram generation flaws:
 * 1. Strips markdown fences (```mermaid ... ```).
 * 2. Normalizes diagram direction keywords.
 * 3. Auto-quotes node labels containing parentheses, colons, or brackets.
 * 4. Ensures diagram type is supported by web and PDF renderers.
 */
export function validateAndCleanMermaid(rawCode?: string | null): MermaidValidationResult {
  if (!rawCode || typeof rawCode !== 'string') {
    return { isValid: false, error: 'No diagram code provided' };
  }

  // 1. Strip markdown fences and whitespace
  let clean = rawCode
    .replace(/^```(?:mermaid)?/i, '')
    .replace(/```$/, '')
    .trim();

  if (!clean) {
    return { isValid: false, error: 'Empty diagram code after stripping code fences' };
  }

  const lines = clean.split('\n').map(l => l.trimEnd());
  const firstNonEmptyLine = lines.find(l => l.trim().length > 0) || '';
  const firstToken = firstNonEmptyLine.trim().split(/\s+/)[0]?.toLowerCase() || '';

  const matchedPrefix = SUPPORTED_DIAGRAM_PREFIXES.find(p => firstToken.startsWith(p));
  if (!matchedPrefix) {
    // If model omitted header but generated node links (e.g. A --> B), prepend 'flowchart TD'
    if (clean.includes('-->') || clean.includes('---') || clean.includes('==>')) {
      clean = `flowchart TD\n${clean}`;
    } else {
      return { isValid: false, error: `Unsupported diagram type or missing header: "${firstToken}"` };
    }
  }

  // 2. Auto-quote node labels containing brackets/parentheses to prevent syntax crashes
  // e.g., Client[Web Browser (HTTP/2)] -> Client["Web Browser (HTTP/2)"]
  const sanitizedLines = clean.split('\n').map(line => {
    // Skip diagram declaration line
    if (SUPPORTED_DIAGRAM_PREFIXES.some(p => line.trim().toLowerCase().startsWith(p))) {
      return line;
    }

    // Match node definitions with unquoted square brackets: ID[Inner Text]
    let fixed = line.replace(/([A-Za-z0-9_-]+)\[([^"\]\n]+)\]/g, (match, nodeId, inner) => {
      if (/[()/,:;&]/.test(inner) && !inner.startsWith('"')) {
        return `${nodeId}["${inner.trim()}"]`;
      }
      return match;
    });

    // Match node definitions with unquoted rounded brackets: ID(Inner Text)
    fixed = fixed.replace(/(^|[^\["\w])([A-Za-z0-9_-]+)\(([^"\)\n]+)\)/g, (match, prefix, nodeId, inner) => {
      if (/[\[\]/,:;&]/.test(inner) && !inner.startsWith('"')) {
        return `${prefix}${nodeId}("${inner.trim()}")`;
      }
      return match;
    });

    return fixed;
  });

  const finalCode = sanitizedLines.join('\n').trim();

  return {
    isValid: true,
    cleanedCode: finalCode,
    diagramType: matchedPrefix || 'flowchart',
  };
}
