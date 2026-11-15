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
   - Structure: Formal definition followed by the core formula or mechanism + ALWAYS provide a concrete short example.

2. 🔹 3 MARKS (Conceptual Note / Brief Comparison):
   - Target length: 70–105 words.
   - Structure: Accurate definition + explanation of working mechanism + 2-3 essential technical points + ALWAYS provide a concrete practical example.

3. 🔹 5 MARKS (Medium Concept / Working Principle):
   - Target length: 160–210 words (expand by 1–2 detailed lines).
   - Structure:
     - Clear formal definition explaining the theoretical foundation.
     - In-depth explanation of working principles (expand with 1–2 additional lines of technical elaboration).
     - 4 structured key points with bold technical keywords.
     - MANDATORY: Always include a concrete practical example or formula demonstrating the concept in a real-world system.

4. 🔹 8 MARKS (Analytical / Design / Detailed Comparison):
   - Target length: 220–300 words.
   - Structure: Formal theoretical foundation -> Detailed working mechanism & characteristics -> ALWAYS provide concrete practical examples -> Key advantages & limitations -> Visual architecture diagram (Mermaid) if architectural or procedural.

5. 🔹 10 MARKS (Long Answer / Comprehensive Question):
   - Target length: 340–440 words (expand by 3–5 detailed lines of technical depth).
   - Standard University 6-Section Writing Pattern:
     - ### 1. Definition
       Write a comprehensive definition in paragraph format explaining the theoretical foundation, core concepts, and operational context (expanded with 1 additional line detailing the primary engineering problem it solves).
     - ### 2. Importance of [Concept] / Core Working Principles
       Use numbered points with bold lead-ins and substantive explanations (expanded by 1–2 additional lines of technical depth per point):
       1. **Core Working Principle / Mechanism:** Detailed technical explanation of how the layer operates.
       2. **Data Management / Consistency Protocol:** Detailed technical explanation of guarantees and mechanisms.
       3. **Reliability & Fault Tolerance:** Detailed explanation of error handling and recovery.
       4. **Transparency & Abstraction Layer:** Detailed technical explanation of virtualization/abstraction.
       5. **Scalability & Performance Impact:** Detailed technical explanation of distributed execution.
     - ### 3. Practical Real-World Examples
       MANDATORY: Always provide concrete practical industrial or enterprise systems applications (e.g. Google Spanner, Apache Cassandra, Linux OS, AWS DynamoDB) with structured technical explanations of how they utilize this architecture.
     - ### 4. Technical Role & Mechanisms / Architecture
       Explain the relevant technical mechanisms, protocols, or architecture using detailed paragraphs, subheadings, and structured points (expanded with 2 additional lines explaining data flow or control flow). (Provide clean Mermaid code in the "diagramMermaid" field).
     - ### 5. Key Advantages & Trade-offs
       Use numbered points with meaningful technical explanations of benefits, limitations, and architectural trade-offs.
     - ### 6. Conclusion
       Write a concise, high-yield academic conclusion summarizing the concept.

6. 🔹 15 MARKS (Major Design / Comprehensive Thesis):
   - Target length: 420–580 words.
   - Comprehensive breakdown covering definition, detailed architecture, step-by-step working, derivations/code, comparison matrix, real-world systems, trade-offs, and conclusion. ALWAYS provide extensive practical examples.

FLEXIBLE STRUCTURAL ADAPTATION BY QUESTION TYPE:
The 6-section layout is an academic standard, NOT a rigid template for every question:
- ⚡ Algorithm Questions: Provide algorithm overview, step-by-step procedure, clean structured pseudocode, formal time/space complexity analysis (Big-O), and ALWAYS provide a trace example with sample inputs.
- 🔢 Numerical Questions: Provide given values, explicit governing formulas with defined variables, step-by-step calculations, and clear final boxed answers with units.
- 📐 Architecture Questions: Include complete system architecture explanation, real-world implementation example, and provide valid Mermaid diagram in diagramMermaid.
- ⚖️ Comparison Questions: Include a structured Markdown comparison table (| Feature / Metric | System A | System B |) followed by concrete comparative examples and key takeaways.
- 📝 Short Questions (2-3 Marks): Keep concise without unnecessary sections, but ALWAYS include a 1-sentence practical example.

CRITICAL CONTENT & FORMATTING RULES:
- 100% READABLE MATHEMATICAL & SYMBOL NOTATION (CRITICAL):
  - NEVER output unreadable raw LaTeX syntax or dollar notation (e.g. DO NOT write raw LaTeX math code, dollar signs, or escaped braces).
  - Always write clean, universally readable text notation that displays clearly in standard academic documents:
    - Write 'Sigma' (or 'Σ / Sigma') instead of LaTeX Sigma.
    - Write 'G = (V, Sigma, R, S)' instead of LaTeX formula notation.
    - Write 'S in V' or 'S belongs to V' instead of LaTeX set membership symbols.
    - Write '{0, 1}' instead of escaped braces.
    - Write '->' instead of LaTeX rightarrow.
    - Write '<=' and '>=' instead of LaTeX inequality symbols.
    - Write '!=' instead of LaTeX not-equal symbols.
  - All symbols must be immediately readable by students without LaTeX escape codes or dollar signs.
- ADD VISUAL CONTENT & DIAGRAMS (HIGH PRIORITY):
  - Whenever a question touches a concept that can be illustrated visually—such as Automata / State Transition Machines, Grammar Parsing / Derivation Trees, Chomsky Hierarchy, System Architecture, Flowcharts, or Data Pipelines—ALWAYS provide clean, valid Mermaid diagram code in the "diagramMermaid" property (e.g. flowchart TD, graph LR, or stateDiagram-v2). This provides clear visual content alongside explanations.
- ALWAYS GIVE AN EXAMPLE: Every single question (regardless of marks) MUST include a concrete, practical real-world or industrial example (e.g., PostgreSQL, Google Spanner, Linux kernel, TCP/IP, or concrete domain scenario) showing how the concept works in practice.
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
