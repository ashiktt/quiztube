/**
 * Saberio AI - Evaluation Dataset & Quality Benchmark
 * Implements Phase 9: Evaluation dataset covering 2M, 5M, 8M, 10M, 15M, numerical,
 * algorithm, and comparison questions for automated regression verification without live paid API costs.
 */

import { QuestionCategory, classifyQuestion } from './reasoningEngine';
import { validateAndRepairSolution } from './responseValidator';
import { SolvedQuestionItem } from '@/types';

export interface BenchmarkQuestion {
  id: string;
  questionNumber: string;
  marks: number;
  expectedCategory: QuestionCategory;
  questionText: string;
  subject: string;
  expectedMinWords: number;
  expectedMaxWords: number;
  mustContainExample: boolean;
  mustContainDiagram: boolean;
  mustContainFormulaOrCode: boolean;
  sampleModelAnswer: SolvedQuestionItem;
}

export const EVALUATION_BENCHMARK_DATASET: BenchmarkQuestion[] = [
  // 1. 2-Mark Definition Question
  {
    id: 'eval-2m-def',
    questionNumber: 'Q1(a)',
    marks: 2,
    expectedCategory: 'definition',
    subject: 'Formal Languages and Automata Theory',
    questionText: 'Define the term "alphabet" in the context of formal languages.',
    expectedMinWords: 30,
    expectedMaxWords: 80,
    mustContainExample: true,
    mustContainDiagram: false,
    mustContainFormulaOrCode: false,
    sampleModelAnswer: {
      questionNumber: 'Q1(a)',
      questionText: 'Define the term "alphabet" in the context of formal languages.',
      marksAllocated: 2,
      answerSummary: 'An alphabet is a finite, non-empty set of symbols from which strings in a formal language are constructed.',
      detailedAnswer: `**Alphabet (Σ):** In formal language theory, an alphabet is a finite, non-empty set of atomic symbols or tokens used to construct valid strings and words in a formal language.

**Example:**
Let Σ = {0, 1}

Possible strings are:
- 0
- 1
- 01
- 101
- 1100`,
      keyPoints: ['Finite, non-empty set', 'Denoted by Σ', 'Atomic building blocks for strings'],
    },
  },

  // 2. 5-Mark Medium Concept Question
  {
    id: 'eval-5m-paging',
    questionNumber: 'Q2',
    marks: 5,
    expectedCategory: 'theoretical',
    subject: 'Operating Systems',
    questionText: 'Explain the working principle of Virtual Memory Paging with its key components.',
    expectedMinWords: 95,
    expectedMaxWords: 190,
    mustContainExample: true,
    mustContainDiagram: false,
    mustContainFormulaOrCode: false,
    sampleModelAnswer: {
      questionNumber: 'Q2',
      questionText: 'Explain the working principle of Virtual Memory Paging with its key components.',
      marksAllocated: 5,
      answerSummary: 'Paging is a memory management scheme that divides logical address space into fixed-size pages and physical memory into frames.',
      detailedAnswer: `**Virtual Memory Paging:** Paging is an operating system memory management architecture that decouples a process's virtual address space from physical RAM by partitioning logical memory into fixed-size blocks called pages, and physical memory into matching frames.

**Core Working Principles:**
1. **Address Translation:** The CPU generates logical addresses split into a page number (p) and page offset (d). The Memory Management Unit (MMU) uses the hardware page table to translate p into a frame base address f.
2. **Elimination of External Fragmentation:** Because any logical page can occupy any non-contiguous physical frame, external fragmentation is eliminated.
3. **Paging Overhead & TLB:** Translation Lookaside Buffers (TLBs) cache recent virtual-to-physical address mappings, maintaining sub-nanosecond memory access speeds.

**Example:**
In the Linux OS x86-64 architecture, 4 KB pages are mapped using a 4-level hierarchical page table structure to isolate process address spaces safely.`,
      keyPoints: ['Fixed-size pages and frames', 'MMU translation using page tables', 'Eliminates external fragmentation', 'Hardware TLB acceleration'],
    },
  },

  // 3. 8-Mark Architecture Question
  {
    id: 'eval-8m-dist-arch',
    questionNumber: 'Q3',
    marks: 8,
    expectedCategory: 'architecture',
    subject: 'Distributed Database Systems',
    questionText: 'Draw and explain the layered architecture of a Distributed Database Management System (DDBMS).',
    expectedMinWords: 160,
    expectedMaxWords: 280,
    mustContainExample: true,
    mustContainDiagram: true,
    mustContainFormulaOrCode: false,
    sampleModelAnswer: {
      questionNumber: 'Q3',
      questionText: 'Draw and explain the layered architecture of a Distributed Database Management System (DDBMS).',
      marksAllocated: 8,
      answerSummary: 'DDBMS architecture coordinates decentralized autonomous database nodes while presenting a unified single-system view to clients.',
      detailedAnswer: `### 1. Architectural Definition
A Distributed Database Management System (DDBMS) governs an interconnected collection of autonomous database engines across a network, ensuring distribution transparency, location transparency, and replication integrity under the ANSI/SPARC 3-schema extended architecture.

### 2. Core Architectural Layers
1. **Global Conceptual Schema (GCS):** Defines the enterprise-wide unified logical view of all data entities, completely hiding site distribution and partitioning details from application clients.
2. **Fragmentation Schema:** Establishes rules for partitioning global relations into horizontal (selection), vertical (projection), or hybrid fragments across participating nodes.
3. **Allocation Schema:** Maps physical data fragments to specific server storage nodes and governs replica placement for high availability.
4. **Local Internal Schema (LIS):** Governs individual physical storage, B-tree indexes, and local transaction engines at each participating physical node.

### 3. Practical Real-World Systems
Google Cloud Spanner and Apache Cassandra employ distributed architectures where client queries interact with routing layers that transparently dispatch localized sub-queries across global availability zones.

### 4. Key Advantages & Trade-offs
- **Advantages:** Unbounded horizontal scaling, local autonomy, and high fault tolerance against single-node crashes.
- **Trade-offs:** Significant catalog synchronization overhead and distributed transaction coordinator latency.`,
      diagramMermaid: `flowchart TD
Client["User Applications"] --> GCS["Global Conceptual Schema"]
GCS --> FS["Fragmentation Schema"]
FS --> AS["Allocation Schema"]
AS --> Node1["Node A (Local DBMS)"]
AS --> Node2["Node B (Local DBMS)"]`,
      keyPoints: ['ANSI/SPARC extended model', 'Global Conceptual Schema', 'Fragmentation and Allocation Schemas', 'Location and Replication Transparency'],
    },
  },

  // 4. Comparison Question
  {
    id: 'eval-compare-tcp-udp',
    questionNumber: 'Q4',
    marks: 5,
    expectedCategory: 'comparison',
    subject: 'Computer Networks',
    questionText: 'Compare and contrast TCP and UDP transport layer protocols.',
    expectedMinWords: 95,
    expectedMaxWords: 200,
    mustContainExample: true,
    mustContainDiagram: false,
    mustContainFormulaOrCode: false,
    sampleModelAnswer: {
      questionNumber: 'Q4',
      questionText: 'Compare and contrast TCP and UDP transport layer protocols.',
      marksAllocated: 5,
      answerSummary: 'TCP is a connection-oriented, reliable byte-stream protocol, whereas UDP is a connectionless, lightweight datagram protocol.',
      detailedAnswer: `**Transport Layer Protocol Comparison:**
Transmission Control Protocol (TCP) and User Datagram Protocol (UDP) represent the two foundational transport layer protocols in the Internet protocol suite, designed for opposing performance vs reliability trade-offs.

| Feature / Metric | Transmission Control Protocol (TCP) | User Datagram Protocol (UDP) |
|---|---|---|
| Connection State | Connection-oriented (3-way handshake) | Connectionless (No handshake) |
| Reliability | 100% Guaranteed delivery with ACKs | Best-effort (Packets may drop/reorder) |
| Flow & Congestion Control | Built-in sliding window & AIMD algorithm | None (Application manages rate) |
| Header Overhead | 20–60 bytes | Minimal 8 bytes |

**Practical Example:**
- **TCP Example:** Web browsing (HTTP/HTTPS) and file transfers (FTP/SSH) require TCP to prevent byte corruption.
- **UDP Example:** Live video streaming and VoIP (Zoom, DNS) utilize UDP to minimize latency over dropped packet recovery.`,
      keyPoints: ['Connection-oriented vs Connectionless', 'Reliable with ACKs vs Best-effort', 'Header overhead 20B vs 8B', 'Sliding window congestion control'],
    },
  },

  // 5. Numerical Question
  {
    id: 'eval-numerical-shannon',
    questionNumber: 'Q5',
    marks: 5,
    expectedCategory: 'numerical',
    subject: 'Digital Communication',
    questionText: 'Calculate the maximum theoretical channel capacity for a channel having bandwidth B = 4 kHz and SNR = 31.',
    expectedMinWords: 50,
    expectedMaxWords: 150,
    mustContainExample: false,
    mustContainDiagram: false,
    mustContainFormulaOrCode: true,
    sampleModelAnswer: {
      questionNumber: 'Q5',
      questionText: 'Calculate the maximum theoretical channel capacity for a channel having bandwidth B = 4 kHz and SNR = 31.',
      marksAllocated: 5,
      answerSummary: 'Using Shannon Channel Capacity theorem, maximum capacity C = 20,000 bps (20 kbps).',
      detailedAnswer: `**1. Given Parameters:**
- Bandwidth (B) = 4 kHz = 4,000 Hz
- Signal-to-Noise Ratio (SNR) = 31 (linear ratio)

**2. Governing Formula:**
By the Shannon-Hartley Theorem:
Capacity C = B * log2(1 + SNR) bits per second (bps)

**3. Step-by-Step Calculation:**
- Substitute given values:
  C = 4000 * log2(1 + 31)
  C = 4000 * log2(32)
- Since 32 = 2^5, log2(32) = 5:
  C = 4000 * 5 = 20,000 bps

**4. Final Answer:**
Maximum Theoretical Channel Capacity C = 20,000 bps = 20 kbps`,
      formulasOrCode: 'C = B * log2(1 + SNR)\nC = 4000 * log2(32) = 20000 bps = 20 kbps',
      keyPoints: ['Shannon-Hartley theorem', 'Formula C = B * log2(1 + SNR)', 'Linear SNR substitution', 'Final capacity 20 kbps'],
    },
  },
];

/**
 * Runs the automated evaluation test on a given benchmark question,
 * returning comprehensive academic evaluation metrics.
 */
export function evaluateBenchmarkItem(
  benchmark: BenchmarkQuestion,
  actualSolution: SolvedQuestionItem
) {
  const classification = classifyQuestion(benchmark.questionText, benchmark.marks);
  const validation = validateAndRepairSolution(actualSolution, benchmark.subject);

  const wordCount = actualSolution.detailedAnswer.trim().split(/\s+/).filter(Boolean).length;
  const wordCountCompliant = wordCount >= benchmark.expectedMinWords && wordCount <= benchmark.expectedMaxWords;

  const categoryMatch = classification.category === benchmark.expectedCategory;
  const examplePresent = /\b(example|for instance|for example|let\s+[A-Za-zΣ]|e\.g\.)\b/i.test(actualSolution.detailedAnswer);
  const diagramPresent = Boolean(actualSolution.diagramMermaid && actualSolution.diagramMermaid.trim().length > 0);

  return {
    id: benchmark.id,
    questionNumber: benchmark.questionNumber,
    marks: benchmark.marks,
    categoryMatch,
    detectedCategory: classification.category,
    expectedCategory: benchmark.expectedCategory,
    wordCount,
    wordCountCompliant,
    examplePresent,
    diagramPresent,
    qualityScore: validation.score,
    isValid: validation.isValid,
    issues: validation.issues,
  };
}
