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

  // 6. Regression Question 1 (2 Marks): Homogeneous Databases
  {
    id: 'eval-2m-homogeneous-db',
    questionNumber: 'Q1',
    marks: 2,
    expectedCategory: 'definition',
    subject: 'Distributed Database Systems',
    questionText: 'What are homogeneous databases?',
    expectedMinWords: 30,
    expectedMaxWords: 80,
    mustContainExample: true,
    mustContainDiagram: false,
    mustContainFormulaOrCode: false,
    sampleModelAnswer: {
      questionNumber: 'Q1',
      questionText: 'What are homogeneous databases?',
      marksAllocated: 2,
      answerSummary: 'A homogeneous distributed database is one where all participating sites use identical DBMS software and data structures.',
      detailedAnswer: `**Homogeneous Databases:** A homogeneous database is a distributed database system where all participating sites use the same database software, identical data structures, and the same underlying operating system.

**Example:**
A national retail bank runs Oracle Database on Linux across all its regional branch offices. Each branch has an identical table schema and executes standard SQL commands without needing software translation.`,
      keyPoints: ['Identical DBMS software across all nodes', 'Same operating system and schema', 'Easy data exchange without gateway translation'],
    },
  },

  // 7. Regression Question 2 (5 Marks): Data Replication in DDBMS
  {
    id: 'eval-5m-data-replication',
    questionNumber: 'Q2',
    marks: 5,
    expectedCategory: 'theoretical',
    subject: 'Distributed Database Systems',
    questionText: 'Explain data replication in DDBMS.',
    expectedMinWords: 95,
    expectedMaxWords: 190,
    mustContainExample: true,
    mustContainDiagram: false,
    mustContainFormulaOrCode: false,
    sampleModelAnswer: {
      questionNumber: 'Q2',
      questionText: 'Explain data replication in DDBMS.',
      marksAllocated: 5,
      answerSummary: 'Data replication stores multiple copies of identical data across several database servers to improve availability and read performance.',
      detailedAnswer: `**Data Replication in DDBMS:** Data replication is the process of storing multiple copies of the same database records across different physical server nodes in a network.

**Main Features of Data Replication:**
1. **High Availability:** If one database server crashes, users can immediately access data from another replica without downtime.
2. **Faster Read Performance:** Client applications read data from the closest local server, avoiding slow network communication.
3. **Fault Tolerance:** Critical applications remain functional even during hardware or network link failures.

**Working Steps:**
1. A client initiates an update transaction on a primary database node.
2. The primary node commits the update and logs the transaction.
3. The update is broadcast across the network to all replica nodes.
4. Replica nodes apply the change to keep their local copies synchronized.

**Practical Example:**
An international airline replicates seat availability tables across servers in New York, London, and Tokyo so local travel agents can check flights in milliseconds.

**Advantages:**
• Zero downtime during single server failures.
• Reduced network load for read-heavy workloads.`,
      keyPoints: ['Multiple copies of data at different sites', 'High availability and fault tolerance', 'Fast local reads', 'Replication synchronization overhead'],
    },
  },

  // 8. Regression Question 3 (8 Marks): Architecture of DDBMS
  {
    id: 'eval-8m-ddbms-architecture',
    questionNumber: 'Q3',
    marks: 8,
    expectedCategory: 'architecture',
    subject: 'Distributed Database Systems',
    questionText: 'Explain the architecture of a Distributed Database Management System.',
    expectedMinWords: 150,
    expectedMaxWords: 270,
    mustContainExample: true,
    mustContainDiagram: true,
    mustContainFormulaOrCode: false,
    sampleModelAnswer: {
      questionNumber: 'Q3',
      questionText: 'Explain the architecture of a Distributed Database Management System.',
      marksAllocated: 8,
      answerSummary: 'DDBMS architecture coordinates multiple independent database sites over a network while providing a single logical view to users.',
      detailedAnswer: `**DDBMS Architecture:** The architecture of a Distributed Database Management System (DDBMS) organizes autonomous local databases across multiple locations while presenting a single unified database to users.

**Core Architectural Components:**
1. **Global Conceptual Schema (GCS):** Defines the complete enterprise data model, completely hiding physical storage locations from users.
2. **Fragmentation Schema:** Defines rules for dividing global relations into horizontal (row-based) or vertical (column-based) fragments.
3. **Allocation Schema:** Specifies which physical database server stores each fragment and its replicas.
4. **Local Conceptual & Internal Schema:** Manages physical data storage, B-tree indexes, and local transactions on individual site machines.

**Working Steps:**
1. A user submits a query to the global query processor.
2. The system analyzes the query using the GCS and fragmentation rules.
3. The query is decomposed into separate sub-queries for each target site.
4. Local DBMS engines execute the sub-queries on their local storage.
5. The DDBMS combines the partial results and returns the final answer to the user.

**Practical Example:**
A university database splits student records by department (Engineering and Business). While each department manages its own server, the registrar views all students through one unified portal.

**Key Advantages:**
• Local autonomy for regional branch offices.
• High availability and modular system expansion.`,
      diagramMermaid: `flowchart TD
Client["User Application"] --> GCS["Global Conceptual Schema"]
GCS --> FS["Fragmentation Schema"]
FS --> AS["Allocation Schema"]
AS --> SiteA["Site A (Local DBMS)"]
AS --> SiteB["Site B (Local DBMS)"]`,
      keyPoints: ['Global Conceptual Schema (GCS)', 'Fragmentation Schema (Horizontal/Vertical)', 'Allocation Schema for site placement', 'Local DBMS autonomy'],
    },
  },

  // 9. Regression Question 4 (10 Marks): Distributed Object Management in DDBMS
  {
    id: 'eval-10m-dist-object-mgmt',
    questionNumber: 'Q4',
    marks: 10,
    expectedCategory: 'theoretical',
    subject: 'Distributed Database Systems',
    questionText: 'Explain Distributed Object Management in DDBMS.',
    expectedMinWords: 210,
    expectedMaxWords: 360,
    mustContainExample: true,
    mustContainDiagram: true,
    mustContainFormulaOrCode: false,
    sampleModelAnswer: {
      questionNumber: 'Q4',
      questionText: 'Explain Distributed Object Management in DDBMS.',
      marksAllocated: 10,
      answerSummary: 'Distributed Object Management enables applications to access, manipulate, and execute methods on objects distributed across multiple computers transparently.',
      detailedAnswer: `**Distributed Object Management in DDBMS:** Distributed Object Management is a software architecture that enables applications to create, locate, and manipulate object-oriented data across multiple computers over a network transparently.

**Main Components:**
1. **Object Request Broker (ORB):** The central communication middleware that routes client method calls to the correct remote object across the network.
2. **Interface Definition Language (IDL):** Specifies object interfaces, methods, and data types independently of any specific programming language.
3. **Object Identifiers (OID):** Unique system-generated keys that permanently identify every object across all network servers.
4. **Object Services:** Provides essential system capabilities such as transaction management, concurrency control, security, and persistence.

**Working of Distributed Object Management:**
1. A client application calls a method on a local proxy object (stub).
2. The stub packages the method name and parameters into a network message (marshaling).
3. The ORB transmits the request across the network to the server hosting the target object.
4. The server skeleton unpackages the message (unmarshaling) and invokes the actual method on the object.
5. The target object executes the business logic and queries local storage if needed.
6. The ORB routes the return result back to the calling client.

**Practical Example:**
In a hospital management system, a Doctor workstation invokes the getMedicalHistory() method on a remote Patient object stored on a central hospital database server. The doctor retrieves patient data without needing to know the server's network address.

**Advantages:**
• High reusability through object-oriented inheritance and encapsulation.
• Complete location transparency across different hardware platforms.

**Conclusion:**
Distributed Object Management connects distributed computing with object-oriented programming, allowing enterprise applications to access remote database objects seamlessly.`,
      diagramMermaid: `flowchart LR
Client["Client Application"] --> Stub["Client Stub"]
Stub --> ORB["Object Request Broker (ORB)"]
ORB --> Skeleton["Server Skeleton"]
Skeleton --> Obj["Remote Database Object"]`,
      keyPoints: ['Object Request Broker (ORB) middleware', 'Interface Definition Language (IDL)', 'Unique Object Identifiers (OID)', 'Marshaling and unmarshaling workflow', 'Complete location transparency'],
    },
  },

  // 10. Regression Question 5 (10 Marks): Advantages and Disadvantages of DDBS
  {
    id: 'eval-10m-ddbs-advantages-disadvantages',
    questionNumber: 'Q5',
    marks: 10,
    expectedCategory: 'advantages_disadvantages',
    subject: 'Distributed Database Systems',
    questionText: 'Discuss the advantages and disadvantages of Distributed Database Systems.',
    expectedMinWords: 210,
    expectedMaxWords: 360,
    mustContainExample: true,
    mustContainDiagram: false,
    mustContainFormulaOrCode: false,
    sampleModelAnswer: {
      questionNumber: 'Q5',
      questionText: 'Discuss the advantages and disadvantages of Distributed Database Systems.',
      marksAllocated: 10,
      answerSummary: 'Distributed Database Systems offer superior availability, local autonomy, and modular scalability, balanced against higher software cost and distributed coordination complexity.',
      detailedAnswer: `**Distributed Database Systems (DDBS):** A Distributed Database System is an integrated collection of multiple logical databases distributed over different physical locations and connected by a computer network.

**Key Advantages:**
1. **Local Autonomy:** Individual branches or departments have direct control over their local data while still participating in enterprise-wide operations.
2. **High Availability and Reliability:** If one database server crashes, other independent sites continue to operate, eliminating a single point of failure.
3. **Improved Performance:** Frequently accessed data is stored close to local users, which significantly reduces network transmission delays.
4. **Modular Scalability:** Organizations can easily add new branch servers and storage without shutting down the existing database system.
5. **Cost Effectiveness:** Connecting multiple smaller, economical computers is often far less expensive than purchasing one giant mainframe.

**Key Disadvantages:**
1. **System Complexity:** Managing distributed transactions, deadlocks, and data replication across sites requires sophisticated software.
2. **High Software Cost:** Purchasing, installing, and licensing DDBMS middleware and networking software involves significant financial investment.
3. **Data Integrity Overhead:** Keeping replicated data synchronized across multiple servers requires expensive protocols like two-phase commit (2PC).
4. **Security Vulnerabilities:** Distributing data over communication networks increases potential security risks and requires strict encryption.

**Practical Example:**
An international e-commerce company like Amazon maintains local databases in North America, Europe, and Asia for quick customer checkout, but must use distributed transaction coordination to keep global inventory levels accurate.

**Conclusion:**
Distributed database systems provide unmatched scalability and uptime for modern enterprises, provided the organization is prepared to handle the operational complexity of distributed consistency.`,
      keyPoints: ['Local autonomy and modular scalability', 'High availability without single point of failure', 'Complexity of distributed transactions', 'Data consistency overhead (Two-phase commit)'],
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
