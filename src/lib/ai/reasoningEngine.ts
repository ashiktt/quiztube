/**
 * Saberio AI - Modular Reasoning Engine & Question Classifier
 * Implements Phase 2: Autonomous question understanding, categorization, and reasoning strategy selection.
 */

export type QuestionCategory =
  | 'theoretical'
  | 'definition'
  | 'comparison'
  | 'numerical'
  | 'derivation'
  | 'algorithm'
  | 'programming'
  | 'architecture'
  | 'diagram_based'
  | 'case_study'
  | 'advantages_disadvantages'
  | 'short_notes';

export interface QuestionClassification {
  category: QuestionCategory;
  confidence: number;
  expectedMarks: number;
  reasoningStrategy: string;
  recommendedStructure: string[];
  requiresDiagram: boolean;
  requiresExample: boolean;
  requiresFormulaOrCode: boolean;
}

/**
 * Classifies an exam question into its appropriate academic category,
 * determining the ideal reasoning strategy, structural components, and depth requirements.
 */
export function classifyQuestion(questionText: string, marksAllocated = 5): QuestionClassification {
  const lower = (questionText || '').toLowerCase().trim();
  const marks = Number(marksAllocated) || 5;

  // 1. Comparison Questions
  if (
    /\b(differ|difference|distinguish|compare|contrast|versus|\bvs\b|comparison)\b/i.test(lower)
  ) {
    return {
      category: 'comparison',
      confidence: 0.95,
      expectedMarks: marks,
      reasoningStrategy: 'Comparative Matrix & Feature-by-Feature Analysis',
      recommendedStructure: [
        'Definition & Conceptual Basis',
        'Structured Markdown Comparison Table (| Feature / Metric | System A | System B |)',
        'Key Operational Trade-offs & Distinct Characteristics',
        'Practical Domain Example & Application Scenarios',
        'Examiner Takeaway / Summary',
      ],
      requiresDiagram: false,
      requiresExample: true,
      requiresFormulaOrCode: false,
    };
  }

  // 2. Architecture Questions
  if (
    /\b(architecture|structural organization|layers of|component diagram|system architecture|ansi\/sparc)\b/i.test(lower)
  ) {
    return {
      category: 'architecture',
      confidence: 0.95,
      expectedMarks: marks,
      reasoningStrategy: 'System Decomposition, Component Data-Flow & Layered Architecture',
      recommendedStructure: [
        'Definition & Architectural Paradigm',
        'Core Architectural Layers / Subsystems (Numbered Points with Bold Lead-ins)',
        'Component Interactions & Data Flow Protocol',
        'Practical Industrial/Enterprise Implementation (e.g., Google Spanner, Cassandra, Linux)',
        'Key Advantages & Architectural Trade-offs',
        'Conclusion & Scalability Overview',
      ],
      requiresDiagram: true,
      requiresExample: true,
      requiresFormulaOrCode: false,
    };
  }

  // 3. Diagram-Based / Flowchart Questions
  if (
    /\b(draw|diagram|flowchart|sketch|neat sketch|state transition|automaton|dfa|nfa|schematic)\b/i.test(lower)
  ) {
    return {
      category: 'diagram_based',
      confidence: 0.92,
      expectedMarks: marks,
      reasoningStrategy: 'Visual State/Process Mapping & Sequential Explanation',
      recommendedStructure: [
        'Conceptual Scope & Purpose of the Diagram',
        'State/Component Specifications & Legend',
        'Step-by-Step Transition / Process Flow',
        'Trace Example with Sample Input',
        'Edge Cases & Error States',
      ],
      requiresDiagram: true,
      requiresExample: true,
      requiresFormulaOrCode: false,
    };
  }

  // 4. Numerical Questions
  if (
    /\b(calculate|compute|numerical|find the value|determine the (frequency|throughput|bandwidth|latency|probability|variance|efficiency))\b/i.test(lower) ||
    /(\b\d+(\.\d+)?\s*(ms|khz|mhz|ghz|kb|mb|gb|bits|bytes|ohm|volts|amps|meters|seconds|sec)\b)/i.test(lower)
  ) {
    return {
      category: 'numerical',
      confidence: 0.94,
      expectedMarks: marks,
      reasoningStrategy: 'Rigorous Mathematical Formulation & Step-by-Step Calculation',
      recommendedStructure: [
        'Given Parameters & Known Values (with explicit units)',
        'Governing Formula / Mathematical Principle (with all variables defined)',
        'Step-by-Step Substitution & Arithmetic Evaluation',
        'Final Boxed Answer with Explicit Units & Precision',
        'Physical / Engineering Interpretation of the Result',
      ],
      requiresDiagram: false,
      requiresExample: false,
      requiresFormulaOrCode: true,
    };
  }

  // 5. Mathematical Derivation Questions
  if (
    /\b(derive|proof|prove that|show that|deduce|mathematical derivation|expression for)\b/i.test(lower)
  ) {
    return {
      category: 'derivation',
      confidence: 0.93,
      expectedMarks: marks,
      reasoningStrategy: 'Axiomatic Step-by-Step Mathematical Derivation',
      recommendedStructure: [
        'Initial Assumptions, System Model & Governing Axioms',
        'Step-by-Step Mathematical Derivation with Explanatory Annotations',
        'Intermediate Algebraic Transformations',
        'Final Governing Equation (Boxed / Highlighted)',
        'Physical Significance & Boundary Conditions',
      ],
      requiresDiagram: false,
      requiresExample: true,
      requiresFormulaOrCode: true,
    };
  }

  // 6. Algorithm Questions
  if (
    /\b(algorithm|pseudocode|time complexity|space complexity|big-o|sorting|searching|traversal|shortest path|dijkstra|greedy|dynamic programming)\b/i.test(lower)
  ) {
    return {
      category: 'algorithm',
      confidence: 0.93,
      expectedMarks: marks,
      reasoningStrategy: 'Algorithmic Decomposition, Pseudocode & Complexity Analysis',
      recommendedStructure: [
        'Algorithmic Intuition & Problem Formulation',
        'Clean, Structured Pseudocode / Step-by-Step Logic',
        'Trace / Dry-Run Example with Concrete Sample Input',
        'Time Complexity Analysis (Best, Average, Worst-case Big-O)',
        'Space Complexity & Memory Trade-offs',
      ],
      requiresDiagram: marks >= 8,
      requiresExample: true,
      requiresFormulaOrCode: true,
    };
  }

  // 7. Programming / Code Implementation Questions
  if (
    /\b(write a program|code implementation|c\+\+|java|python|sql query|implement a function|class for)\b/i.test(lower)
  ) {
    return {
      category: 'programming',
      confidence: 0.92,
      expectedMarks: marks,
      reasoningStrategy: 'Production-Grade Idiomatic Code Implementation',
      recommendedStructure: [
        'Technical Approach & Algorithmic Strategy',
        'Well-Commented, Clean Source Code Snippet',
        'Line-by-Line / Block Explanation of Key Operations',
        'Sample Input, Output, and Edge Case Handling',
      ],
      requiresDiagram: false,
      requiresExample: true,
      requiresFormulaOrCode: true,
    };
  }

  // 8. Advantages and Disadvantages Questions
  if (
    /\b(advantages|disadvantages|pros and cons|merits and demerits|benefits and limitations|trade-offs)\b/i.test(lower)
  ) {
    return {
      category: 'advantages_disadvantages',
      confidence: 0.91,
      expectedMarks: marks,
      reasoningStrategy: 'Critical Evaluation & Architectural Trade-offs',
      recommendedStructure: [
        'Brief Conceptual Foundation',
        'Key Advantages (Structured Numbered Points with Concrete Mechanics)',
        'Key Limitations / Disadvantages (Structured Numbered Points with Real Bottlenecks)',
        'Mitigation Strategies & Optimization Techniques',
        'Practical Decision Criterion (When to use vs avoid)',
      ],
      requiresDiagram: false,
      requiresExample: true,
      requiresFormulaOrCode: false,
    };
  }

  // 9. Definition Questions (Typically 2-3 marks)
  if (
    marks <= 3 ||
    /^(define|what is|state the definition|meaning of|explain the term)\b/i.test(lower)
  ) {
    return {
      category: 'definition',
      confidence: 0.90,
      expectedMarks: marks,
      reasoningStrategy: 'Formal Direct Definition with Authentic Mathematical Symbols & Concrete Instance',
      recommendedStructure: [
        'Formal Academic Definition with exact symbol notation',
        'Governing equation or formal representation where applicable',
        'Dedicated Example with explicit declaration and vertical bulleted cases',
      ],
      requiresDiagram: false,
      requiresExample: true,
      requiresFormulaOrCode: false,
    };
  }

  // 10. Short Notes Questions
  if (
    /\b(short notes?|briefly explain|write a brief note|discuss briefly)\b/i.test(lower)
  ) {
    return {
      category: 'short_notes',
      confidence: 0.88,
      expectedMarks: marks,
      reasoningStrategy: 'High-Yield Synthesis & Core Conceptual Anchors',
      recommendedStructure: [
        'Core Definition & Purpose',
        '3–4 Critical Technical Working Principles',
        'Concrete Real-World Application Example',
        'Key Takeaway / Significance',
      ],
      requiresDiagram: marks >= 5,
      requiresExample: true,
      requiresFormulaOrCode: false,
    };
  }

  // 11. Case Study Questions
  if (
    /\b(case study|scenario|real-world scenario|assume you are|design a solution for)\b/i.test(lower)
  ) {
    return {
      category: 'case_study',
      confidence: 0.90,
      expectedMarks: marks,
      reasoningStrategy: 'Applied Systems Engineering & Scenario Diagnosis',
      recommendedStructure: [
        'Scenario Diagnosis & Requirements Breakdown',
        'Architectural Solution & Technical Choices',
        'Implementation Workflow & Protocol Sequencing',
        'Potential Failure Modes & Mitigation Strategies',
      ],
      requiresDiagram: true,
      requiresExample: true,
      requiresFormulaOrCode: false,
    };
  }

  // 12. Default Theoretical / Comprehensive Question
  return {
    category: 'theoretical',
    confidence: 0.85,
    expectedMarks: marks,
    reasoningStrategy: 'Comprehensive Academic Exposition & Conceptual Breakdown',
    recommendedStructure: [
      'Formal Definition & Theoretical Foundation',
      'Working Mechanism & Core Operational Principles',
      'Structured Technical Characteristics (Bold Lead-ins)',
      'Practical Real-World Systems Example',
      'Significance, Advantages & Conclusion',
    ],
    requiresDiagram: marks >= 8,
    requiresExample: true,
    requiresFormulaOrCode: false,
  };
}
