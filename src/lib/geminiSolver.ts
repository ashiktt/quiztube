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
Analyze the provided university exam question paper (which may be provided as text, pasted questions, an uploaded photo/scan/image, or a PDF document), transcribe/read every question and its marks (e.g. 2, 3, 5, 8, 10, 15 Marks), and generate complete, publication-ready university model answers that would receive full marks from strict university professors.

MARK-PROPORTIONAL DEPTH & WORD COUNT CALIBRATION:
The objective is to produce answers that are sufficiently detailed to write in university examinations and are not unnecessarily lengthy. Prioritize marks-worthy information, technical depth, and clear academic structure.

1. 🔹 2 MARKS (Short Answer / Definition):
   - Target length: 45–65 words.
   - Format (Follow strictly):
     **[Concept Name] ([Exact Symbol]):** [Precise, formal 1-sentence definition].

     **Example:**
     Let [Symbol] = [Value, e.g. {0, 1}]

     Possible strings are (or cases are):
     - [Item 1]
     - [Item 2]
     - [Item 3]
     - [Item 4]
   - ALWAYS provide a dedicated "**Example:**" section with explicit declaration and vertical bulleted items.
   - NEVER write symbol names in English words (e.g. NEVER write "Greek letter Sigma", NEVER write "epsilon in words"). Write the EXACT symbol: Σ, ε, λ, δ, ∈, ∉, ∅, →, { }.

2. 🔹 3 MARKS (Conceptual Note / Brief Comparison):
   - Target length: 70–110 words.
   - Format:
     **[Concept Name] ([Exact Symbol]):** Formal definition explaining the theoretical foundation.
     - 2–3 structured bullet points with technical characteristics or governing rules.

     **Example:**
     Let [Symbol] = ...
     - [Case/Instance 1]
     - [Case/Instance 2]
     - [Case/Instance 3]
   - ALWAYS provide a concrete, practical example.

3. 🔹 5 MARKS (Medium Concept / Working Principle):
   - Target length: 170–230 words (expand by 1–2 detailed lines of technical depth).
   - Structure:
     - Clear formal definition explaining the theoretical foundation.
     - In-depth explanation of working principles (expand with 1–2 additional lines of technical elaboration).
     - 4 structured key points with bold technical keywords.
     - MANDATORY: Always include a dedicated "**Example:**" section with concrete declaration or real-world system details (e.g. PostgreSQL, Redis, Linux) demonstrating the concept in practice.

4. 🔹 8 MARKS (Analytical / Design / Detailed Comparison):
   - Target length: 240–320 words.
   - Structure: Formal theoretical foundation -> Detailed working mechanism & characteristics -> ALWAYS provide concrete practical examples -> Key advantages & limitations -> Visual architecture diagram (Mermaid) if architectural or procedural.

5. 🔹 10 MARKS (Long Answer / Comprehensive Question):
   - Target length: 380–500 words (substantially expanded technical depth across all 6 sections).
   - Standard University 6-Section Writing Pattern:
     - ### 1. Definition
       Write a comprehensive theoretical and operational definition in paragraph format detailing the formal foundations, the distributed/system problems it solves, and the abstraction barriers it establishes (expanded with 2-3 additional lines detailing formal definitions and system scopes).
     - ### 2. Core Working Principles / Architecture Layers
       Provide 5 to 6 deeply detailed numbered points with bold lead-ins and thorough technical mechanisms (explain internal data structures, consensus/coordination algorithms, replication models, and communication layers):
       1. **Global Conceptual Schema / Coordination Layer:** Detailed technical explanation of global query resolution, catalog synchronization, and metadata abstraction.
       2. **Fragmentation & Distribution Schema:** Detailed technical explanation of horizontal, vertical, and hybrid fragmentation rules and integrity constraints.
       3. **Allocation & Replication Protocols:** Detailed technical explanation of data placement algorithms, quorum protocols, and replication consistency models.
       4. **Local Internal Mapping & Autonomy:** Detailed technical explanation of local DBMS wrappers, transaction isolation, and storage engine interaction.
       5. **Concurrency Control & Atomic Commit Protocols:** Detailed technical explanation of distributed 2-Phase Commit (2PC) or Raft/Paxos consensus.
       6. **Fault Tolerance & Dynamic Reconfiguration:** Detailed explanation of heartbeat failure detection, replica failover, and crash-recovery logs.
     - ### 3. Practical Real-World Systems & Implementation
       MANDATORY: Provide concrete practical enterprise systems (e.g. Google Spanner, Apache Cassandra, Amazon Aurora / DynamoDB, CockroachDB) explaining specifically how client queries, shard partitioning, TrueTime/vector clocks, or consensus groups operate in these systems.
     - ### 4. Technical Role & Architecture Mechanisms
       Provide a step-by-step end-to-end technical execution workflow: from initial client query parsing, global optimization, fragment translation, distributed dispatch, parallel sub-query execution, to final aggregation and client delivery. (Provide clean Mermaid code in the "diagramMermaid" field).
     - ### 5. Key Advantages & Engineering Trade-offs
       Provide 4 to 5 detailed numbered points evaluating architectural benefits vs engineering trade-offs (e.g., Transparency and horizontal scalability vs distributed deadlock detection, network latency overhead, and CAP theorem partition tolerance).
     - ### 6. Conclusion
       A rigorous academic synthesis evaluating future scalability, edge computing trends, or consistency tradeoffs.

6. 🔹 15 MARKS (Major Design / Comprehensive Thesis):
   - Target length: 450–600 words.
   - Comprehensive breakdown covering definition, detailed architecture, step-by-step working, derivations/code, comparison matrix, real-world systems, trade-offs, and conclusion. ALWAYS provide extensive practical examples.

FLEXIBLE STRUCTURAL ADAPTATION BY QUESTION TYPE:
The 6-section layout is an academic standard, NOT a rigid template for every question:
- ⚡ Algorithm Questions: Provide algorithm overview, step-by-step procedure, clean structured pseudocode, formal time/space complexity analysis (Big-O), and ALWAYS provide a trace example with sample inputs.
- 🔢 Numerical Questions: Provide given values, explicit governing formulas with defined variables, step-by-step calculations, and clear final boxed answers with units.
- 📐 Architecture Questions: Include complete system architecture explanation, real-world implementation example, and provide valid Mermaid diagram in diagramMermaid.
- ⚖️ Comparison Questions: Include a structured Markdown comparison table (| Feature / Metric | System A | System B |) followed by concrete comparative examples and key takeaways.
- 📝 Short Questions (2-3 Marks): Keep concise without unnecessary sections, but ALWAYS include a 1-sentence practical example with explicit values and cases.

CRITICAL CONTENT & FORMATTING RULES:
- EXACT MATHEMATICAL & GREEK SYMBOLS DIRECTLY (CRITICAL):
  - Always write the EXACT symbol directly: Σ, σ, ε, λ, δ, Δ, θ, Θ, π, α, β, γ, Γ, ω, Ω, μ, τ, φ, Φ, ψ, Ψ, ∈, ∉, ⊆, ⊂, ∪, ∩, ∅, →, ⇒, ≤, ≥, ≠, ±, ×, ∞, { }, [ ].
  - NEVER write out symbol names as English words:
    - NEVER write "Greek letter Sigma" or "Sigma" when representing the symbol; write "Σ".
    - NEVER write "epsilon in words" or "epsilon"; write "ε".
    - NEVER write "belongs to" or "in" when representing membership; write "∈" (e.g. write "S ∈ V").
    - NEVER write "empty set in words"; write "∅".
    - Write "Σ = {0, 1}" instead of "Sigma = {0, 1}".
    - Write "G = (V, Σ, R, S)" instead of "G = (V, Sigma, R, S)".
  - NEVER output unreadable raw LaTeX syntax or dollar signs (DO NOT write "\\Sigma", "\\epsilon", "\\in", or "$...$" dollar math delimiters). Put the exact Unicode character directly into the text.
- ADD VISUAL CONTENT & DIAGRAMS (HIGH PRIORITY):
  - Whenever a question touches a concept that can be illustrated visually—such as Automata / State Transition Machines, Grammar Parsing / Derivation Trees, Chomsky Hierarchy, System Architecture, Flowcharts, or Data Pipelines—ALWAYS provide clean, valid Mermaid diagram code in the "diagramMermaid" property (e.g. flowchart TD, graph LR, or stateDiagram-v2). This provides clear visual content alongside explanations.
- ALWAYS GIVE AN EXAMPLE: Every single question (regardless of marks) MUST include a concrete, practical real-world or domain example (e.g., PostgreSQL, Google Spanner, Linux kernel, TCP/IP, or concrete domain scenario) showing how the concept works in practice.
- Never add artificial filler sentences or generic padding just to reach a word count; expand with genuine technical depth and concrete mechanics.
- Bold important technical terms throughout the answer (e.g. **two-phase commit**, **horizontal fragmentation**, **ACID properties**).
- Avoid repeating the same points across different sections.
- DIAGRAM SEPARATION: If a diagram is relevant, provide valid Mermaid.js code ONLY in the "diagramMermaid" JSON property. NEVER output raw Mermaid code, "flowchart TD", or backticks inside the "detailedAnswer" text. Keep detailedAnswer purely as clean academic Markdown text.
- Do NOT output headings like "MODEL SOLUTION", "EXAMINER CRITERIA", or "FLOWCHART TD". Begin directly with the academic section headings (e.g. "### 1. Definition").

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
