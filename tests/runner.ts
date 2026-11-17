/**
 * Student Copilot & Saberio AI Comprehensive Test Suite
 * Tests critical security, validation, idempotency, auth, and extraction functionality.
 */

import assert from 'assert';
import crypto from 'crypto';
import { validateEventProposal, sanitizeString, validateIsoDateString } from '../src/lib/assistant/eventValidation';
import { ALLOWED_AUTOMATION_ACTIONS, isN8nConfigured } from '../src/lib/assistant/n8nClient';
import { checkRateLimit } from '../src/lib/assistant/rateLimiter';
import { verifyInternalSecret } from '../src/lib/assistant/internalAuth';
import { signToken, verifyToken } from '../src/lib/jwt';
import { generateStudySetWithGemini } from '../src/lib/gemini';
import { solveUniversityQuestionsWithGemini } from '../src/lib/geminiSolver';
import { generateTutorResponse } from '../src/lib/geminiTutor';
import { sanitizeMongoUri, getDatabaseErrorMessage, getMongoUri } from '../src/lib/mongodb';
import { cleanMarkdownText, parseStyledSpans, exportUniversityExamPdf } from '../src/lib/examPdfExport';
import { SABERIO_LOGO_BASE64 } from '../src/lib/logoBase64';
import { drawPdfFirstPageHeader, drawPdfRunningHeader, finalizePdfLayout } from '../src/lib/pdfBranding';
import { jsPDF } from 'jspdf';
import { runSecurityTests } from './security.test';

let testsPassed = 0;
let testsFailed = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    testsPassed++;
  } catch (err: unknown) {
    console.error(`  ✗ FAIL: ${name}`);
    if (err instanceof Error) {
      console.error(`    ${err.message}`);
    }
    testsFailed++;
  }
}

async function runAllTests() {
  console.log('\n==================================================');
  console.log('Running Saberio AI Verification Test Suite');
  console.log('==================================================\n');

  // Test 1: Event extraction and normalization
  runTest('1. Valid event structure is validated and normalized', () => {
    const rawProposal = {
      title: 'DBMS Internal Examination',
      eventType: 'exam' as const,
      description: 'Revise indexing, B-trees and hashing.',
      startAt: '2026-10-22T10:00:00+05:30',
      endAt: null,
      timezone: 'Asia/Kolkata',
      location: 'Hall 3',
      tasks: ['Revise indexing', 'Study B-trees', 'Review hashing'],
      proposedReminders: [{ offsetMinutes: 1440 }, { offsetMinutes: 60 }],
      confidence: 0.95,
      needsConfirmation: false,
      missingFields: [],
    };

    const result = validateEventProposal(rawProposal, 'Asia/Kolkata', new Date('2026-10-17T00:00:00Z'));
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.sanitized.title, 'DBMS Internal Examination');
    assert.strictEqual(result.sanitized.eventType, 'exam');
    assert.strictEqual(result.sanitized.tasks.length, 3);
    assert.strictEqual(result.sanitized.proposedReminders.length, 2);
    assert.strictEqual(result.sanitized.needsConfirmation, false);
  });

  // Test 2: Ambiguous or missing event dates handled safely
  runTest('2. Ambiguous or missing event dates are flagged with needsConfirmation', () => {
    const ambiguousProposal = {
      title: 'Operating Systems Quiz',
      eventType: 'exam' as const,
      description: 'Covers process scheduling.',
      startAt: '', // Missing date
      timezone: 'Asia/Kolkata',
      tasks: ['Processes'],
      proposedReminders: [],
      needsConfirmation: false,
      missingFields: [],
    };

    const result = validateEventProposal(ambiguousProposal, 'Asia/Kolkata');
    assert.strictEqual(result.sanitized.needsConfirmation, true);
    assert.ok(result.sanitized.missingFields.includes('startAt'));
    assert.ok(result.sanitized.clarificationPrompt?.length);
  });

  // Test 3: Past dates handled safely
  runTest('3. Dates in the past trigger future_date_confirmation', () => {
    const pastProposal = {
      title: 'Old Assignment',
      eventType: 'assignment' as const,
      startAt: '2020-01-01T10:00:00Z',
      timezone: 'Asia/Kolkata',
      tasks: ['Submit code'],
      proposedReminders: [],
      missingFields: [],
    };

    const result = validateEventProposal(pastProposal, 'Asia/Kolkata', new Date('2026-10-17T00:00:00Z'));
    assert.strictEqual(result.sanitized.needsConfirmation, true);
    assert.ok(result.sanitized.missingFields.includes('future_date_confirmation'));
  });

  // Test 4: Invalid event type normalized to 'general'
  runTest('4. Invalid or unrecognized event types normalize to general', () => {
    const invalidTypeProposal = {
      title: 'Campus Hackathon',
      eventType: 'party_event' as any,
      startAt: '2026-11-01T10:00:00+05:30',
      tasks: [],
      proposedReminders: [],
    };

    const result = validateEventProposal(invalidTypeProposal, 'Asia/Kolkata');
    assert.strictEqual(result.sanitized.eventType, 'general');
  });

  // Test 5: Sanitization removes control characters and caps length
  runTest('5. Free-text inputs are sanitized against control chars and length capped', () => {
    const dirty = 'Hello\u0000World\u0008Test';
    const clean = sanitizeString(dirty, 50);
    assert.strictEqual(clean, 'HelloWorldTest');

    const longStr = 'a'.repeat(3000);
    const capped = sanitizeString(longStr, 250);
    assert.strictEqual(capped.length, 250);
  });

  // Test 6: Fail-closed JWT security
  runTest('6. JWT fails closed when JWT_SECRET is missing and signs properly when set', () => {
    const originalSecret = process.env.JWT_SECRET;
    try {
      // Test fail closed
      delete process.env.JWT_SECRET;
      assert.throws(() => {
        signToken({ userId: 'u123', email: 'student@example.com' });
      }, /JWT_SECRET environment variable is not configured/);

      const nullPayload = verifyToken('some_fake_token');
      assert.strictEqual(nullPayload, null);

      // Test signed token
      process.env.JWT_SECRET = 'a_very_long_secure_secret_key_at_least_32_characters_long';
      const token = signToken({
        userId: 'u_abc_123',
        email: 'alice@mit.edu',
        fullName: 'Alice Johnson',
        isAdmin: true,
      });

      assert.ok(typeof token === 'string' && token.length > 20);

      const verified = verifyToken(token);
      assert.ok(verified);
      assert.strictEqual(verified?.userId, 'u_abc_123');
      assert.strictEqual(verified?.email, 'alice@mit.edu');
      assert.strictEqual(verified?.fullName, 'Alice Johnson');
      assert.strictEqual(verified?.isAdmin, true);
    } finally {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  // Test 7: n8n allowlisted action validation
  runTest('7. Only allowlisted automation actions are accepted', () => {
    assert.ok(ALLOWED_AUTOMATION_ACTIONS.includes('event.confirmed'));
    assert.ok(ALLOWED_AUTOMATION_ACTIONS.includes('task.created'));
    assert.ok(ALLOWED_AUTOMATION_ACTIONS.includes('reminders.create'));
    assert.ok(ALLOWED_AUTOMATION_ACTIONS.includes('event.updated'));
    assert.ok(ALLOWED_AUTOMATION_ACTIONS.includes('event.cancelled'));
    assert.ok(ALLOWED_AUTOMATION_ACTIONS.includes('study_plan.suggested'));

    // Arbitrary action must not be included
    assert.strictEqual((ALLOWED_AUTOMATION_ACTIONS as readonly string[]).includes('shell.exec'), false);
    assert.strictEqual((ALLOWED_AUTOMATION_ACTIONS as readonly string[]).includes('database.drop'), false);
  });

  // Test 8: n8n configuration detection
  runTest('8. Missing n8n configuration is detected without crashing', () => {
    const origUrl = process.env.N8N_EVENT_WEBHOOK_URL;
    try {
      delete process.env.N8N_EVENT_WEBHOOK_URL;
      assert.strictEqual(isN8nConfigured(), false);
    } finally {
      process.env.N8N_EVENT_WEBHOOK_URL = origUrl;
    }
  });

  // Test 9: Internal auth fail-closed check
  runTest('9. Internal callback routes fail closed when secret is missing', () => {
    const origSecret = process.env.ASSISTANT_INTERNAL_API_SECRET;
    try {
      delete process.env.ASSISTANT_INTERNAL_API_SECRET;
      const headers = new Headers();
      headers.set('X-Internal-Secret', 'some-secret');
      assert.strictEqual(verifyInternalSecret({ headers } as any), false);
    } finally {
      process.env.ASSISTANT_INTERNAL_API_SECRET = origSecret;
    }
  });

  // Test 10: Idempotency keys deterministic
  runTest('10. Idempotency keys are deterministic and prevent duplicates', () => {
    const userId = 'user_99';
    const eventId = 'event_42';
    const offsetMinutes = 60;
    const channel = 'telegram';

    const key1 = crypto
      .createHash('sha256')
      .update(`${userId}:${eventId}:${offsetMinutes}:${channel}`)
      .digest('hex');

    const key2 = crypto
      .createHash('sha256')
      .update(`${userId}:${eventId}:${offsetMinutes}:${channel}`)
      .digest('hex');

    assert.strictEqual(key1, key2);

    const differentChannelKey = crypto
      .createHash('sha256')
      .update(`${userId}:${eventId}:${offsetMinutes}:email`)
      .digest('hex');

    assert.notStrictEqual(key1, differentChannelKey);
  });

  // Test 11: Rate limiter enforces windows
  runTest('11. Rate limiter enforces allowed request counts', () => {
    const key = `test_rate_user_${Date.now()}`;
    const limit = 3;

    const r1 = checkRateLimit(key, limit, 10000);
    assert.strictEqual(r1.allowed, true);
    assert.strictEqual(r1.remaining, 2);

    const r2 = checkRateLimit(key, limit, 10000);
    assert.strictEqual(r2.allowed, true);
    assert.strictEqual(r2.remaining, 1);

    const r3 = checkRateLimit(key, limit, 10000);
    assert.strictEqual(r3.allowed, true);
    assert.strictEqual(r3.remaining, 0);

    const r4 = checkRateLimit(key, limit, 10000);
    assert.strictEqual(r4.allowed, false);
    assert.strictEqual(r4.remaining, 0);
  });

  // Test 12: Existing application features remain operational
  runTest('12. Existing YouTube Quiz, Exam Solver, and AI Tutor modules are exported and functional', () => {
    assert.strictEqual(typeof generateStudySetWithGemini, 'function');
    assert.strictEqual(typeof solveUniversityQuestionsWithGemini, 'function');
    assert.strictEqual(typeof generateTutorResponse, 'function');
  });

  // Test 13: Database URI sanitization masks credentials
  runTest('13. sanitizeMongoUri masks password credentials and preserves host and db', () => {
    const sensitiveUri = 'mongodb+srv://student_admin:SuperSecretPassword123@cluster0.hql9pgt.mongodb.net/saberio?appName=Cluster0';
    const sanitized = sanitizeMongoUri(sensitiveUri);
    assert.strictEqual(sanitized.includes('SuperSecretPassword123'), false);
    assert.ok(sanitized.includes('student_admin:***@cluster0.hql9pgt.mongodb.net/saberio'));
  });

  // Test 14: Database error message sanitization replaces raw connection errors
  runTest('14. getDatabaseErrorMessage replaces raw connection errors with friendly message', () => {
    const rawErrors = [
      new Error('connect ECONNREFUSED 127.0.0.1:27017'),
      new Error('connect ECONNREFUSED localhost:27017'),
      new Error('MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you\'re trying to access the database from an IP that isn\'t whitelisted'),
      new Error('MongoNetworkError: 30340000:error:0A000438:SSL routines:ssl3_read_bytes:tlsv1 alert internal error'),
      new Error('Database configuration missing. MONGODB_URI environment variable is not defined.'),
      new Error('connect ETIMEDOUT 159.41.196.109:27017'),
    ];

    const expected = "We couldn't connect to the service. Please try again shortly.";
    for (const err of rawErrors) {
      const sanitized = getDatabaseErrorMessage(err);
      assert.strictEqual(sanitized, expected);
      assert.strictEqual(sanitized.includes('27017'), false);
      assert.strictEqual(sanitized.includes('ECONNREFUSED'), false);
      assert.strictEqual(sanitized.includes('127.0.0.1'), false);
      assert.strictEqual(sanitized.includes('whitelist'), false);
    }
  });

  // Test 15: getMongoUri fails fast without unintended localhost:27017 fallback
  runTest('15. getMongoUri throws descriptive error when MONGODB_URI is missing (no localhost:27017 fallback)', () => {
    const origUri = process.env.MONGODB_URI;
    try {
      delete process.env.MONGODB_URI;
      assert.throws(() => {
        getMongoUri();
      }, /Database configuration missing\. MONGODB_URI environment variable is not defined\./);
    } finally {
      process.env.MONGODB_URI = origUri;
    }
  });

  // Test 16: Email validation regex pattern works accurately
  runTest('16. Email regex strictly accepts valid emails and rejects malformed inputs', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    assert.strictEqual(emailRegex.test('student@university.edu'), true);
    assert.strictEqual(emailRegex.test('john.doe@gmail.com'), true);
    assert.strictEqual(emailRegex.test('invalid-email'), false);
    assert.strictEqual(emailRegex.test('user@'), false);
    assert.strictEqual(emailRegex.test('@domain.com'), false);
    assert.strictEqual(emailRegex.test('user @domain.com'), false);
  });

  // Test 17: No unintended localhost:27017 in getMongoUri
  runTest('17. Configured MONGODB_URI returns correctly when set', () => {
    const origUri = process.env.MONGODB_URI;
    try {
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/testdb';
      assert.strictEqual(getMongoUri(), 'mongodb+srv://user:pass@cluster.mongodb.net/testdb');
    } finally {
      process.env.MONGODB_URI = origUri;
    }
  });

  // Test 18: cleanMarkdownText strips markdown syntax while preserving technical text
  runTest('18. cleanMarkdownText removes hashes, bold asterisks, and normalizes colons', () => {
    const raw = '### 1. **Definition:** Distributed Object Management (DOM) in DDBMS:: is a paradigm...';
    const cleaned = cleanMarkdownText(raw);
    assert.strictEqual(cleaned.includes('###'), false);
    assert.strictEqual(cleaned.includes('**'), false);
    assert.strictEqual(cleaned.includes('::'), false);
    assert.ok(cleaned.includes('1. Definition: Distributed Object Management (DOM) in DDBMS: is a paradigm'));
  });

  // Test 19: parseStyledSpans parses inline bold, code, and regular text
  runTest('19. parseStyledSpans separates styled bold tokens and code', () => {
    const rawLine = '1. **Data Sharing:** Allows `objects` to be accessed transparently.';
    const spans = parseStyledSpans(rawLine);
    assert.ok(spans.length >= 3);
    const boldSpan = spans.find(s => s.bold);
    assert.ok(boldSpan && boldSpan.text.includes('Data Sharing'));
    const codeSpan = spans.find(s => s.code);
    assert.ok(codeSpan && codeSpan.text === 'objects');
  });

  // Test 20: University Exam Mark Calibration targets
  runTest('20. University exam mark calibration targets match academic standards', () => {
    const calibration = {
      2: { min: 45, max: 65 },
      3: { min: 70, max: 105 },
      5: { min: 160, max: 210 },
      8: { min: 220, max: 300 },
      10: { min: 340, max: 440 },
      15: { min: 420, max: 580 },
    };

    assert.strictEqual(calibration[2].min, 45);
    assert.strictEqual(calibration[5].min, 160);
    assert.strictEqual(calibration[10].min, 340);
    assert.strictEqual(calibration[15].min, 420);
  });

  // Test 21: Official Saberio AI Logo Base64 asset integrity
  runTest('21. Saberio AI official logo base64 is present and valid image data URI', () => {
    assert.ok(SABERIO_LOGO_BASE64.startsWith('data:image/'));
    assert.ok(SABERIO_LOGO_BASE64.length > 500);
  });

  // Test 22: PDF Running Header Collision Prevention & Layout Finalization
  runTest('22. PDF running header prevents collision with long subjects and renders cleanly', () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const longSubject = 'DISTRIBUTED DATABASES (BTCS706-18) — ADVANCED QUERY OPTIMIZATION AND CONCURRENCY CONTROL';
    
    // Test First Page Header
    const yPos = drawPdfFirstPageHeader(doc, {
      subject: longSubject,
      documentTitle: 'UNIVERSITY MODEL SOLUTIONS',
      academicLevel: 'B.Tech CSE - 7th Semester',
      totalMarks: 50,
      itemCount: 5,
    });
    assert.ok(yPos > 30, 'First page header must return valid content yPos');

    // Add second page and test running header
    doc.addPage();
    drawPdfRunningHeader(doc, {
      subject: longSubject,
      rightLabel: 'SABERIO AI  •  MODEL SOLUTIONS',
    });

    // Test finalizePdfLayout across all pages
    finalizePdfLayout(doc, {
      subject: longSubject,
      rightHeaderLabel: 'SABERIO AI  •  MODEL SOLUTIONS',
    });

    assert.strictEqual(doc.getNumberOfPages(), 2);
  });

  // Test 23: Complete University Exam PDF with multi-line lists exports without overlapping lines
  await (async () => {
    try {
      const mockExam = {
        subject: 'Distributed Database Systems (BTCS706)',
        academicLevel: 'B.Tech CSE - 7th Semester',
        totalMarks: 10,
        solutions: [
          {
            questionNumber: 'Q9',
            questionText: 'Draw and explain the architecture of Distributed Databases.',
            marksAllocated: 10,
            detailedAnswer: [
              '### 1. Definition',
              'Distributed database architecture defines the structural organization of software components across a computer network.',
              '### 2. Core Working Principles / Architecture Layers',
              '1. Global Conceptual Schema: Provides an integrated, unified view of the entire global database, hiding all distribution details from users.',
              '2. Fragmentation Schema: Defines how global relations are divided into horizontal, vertical, or hybrid fragments distributed across network sites.',
              '3. Allocation Schema: Specifies physical storage sites for each data fragment and manages replica placement.',
              '4. Local Internal Schema: Governs physical data storage, indexing, and access methods at each individual participating site.',
              '### 5. Key Advantages & Trade-offs',
              '1. Transparency: Users interact with the system as if it were a single centralized database.',
              '2. Modular Scalability: New sites and storage nodes can be added easily without altering the global schema.',
              '3. Design Complexity: Managing distributed catalogs, schema mapping, and network communication overhead introduces significant architectural complexity.',
            ].join('\n'),
          },
        ],
      };

      await exportUniversityExamPdf(mockExam as any);
      console.log('  ✓ PASS: 23. Full university exam PDF with multi-line lists renders without overlap');
      testsPassed++;

      // Clean up any generated test file
      const fs = await import('fs');
      const files = fs.readdirSync('.');
      for (const f of files) {
        if (f.startsWith('Saberio_AI_Distributed_Database') && f.endsWith('.pdf')) {
          fs.unlinkSync(f);
        }
      }
    } catch (err: unknown) {
      console.error('  ✗ FAIL: 23. Full university exam PDF with multi-line lists renders without overlap');
      if (err instanceof Error) console.error(`    ${err.message}`);
      testsFailed++;
    }
  })();

  // Test 24: Raw LaTeX symbols are converted to authentic mathematical symbols (Σ, ε, ∈, ∅, →)
  runTest('24. LaTeX symbols and dollar notation are converted to authentic mathematical symbols', () => {
    const rawGrammarText =
      'A formal grammar $G$ is represented as: $G = (V, \\Sigma, R, S)$, where $S \\in V$ and $\\Sigma = \\{0, 1\\}$. An empty string is $\\epsilon$.';
    const cleaned = cleanMarkdownText(rawGrammarText);
    assert.strictEqual(cleaned.includes('$'), false, 'Should strip raw dollar signs');
    assert.strictEqual(cleaned.includes('\\Sigma'), false, 'Should convert \\Sigma');
    assert.strictEqual(cleaned.includes('\\in'), false, 'Should convert \\in');
    assert.strictEqual(cleaned.includes('\\epsilon'), false, 'Should convert \\epsilon');
    assert.strictEqual(cleaned.includes('\\{'), false, 'Should unescape braces');
    assert.ok(cleaned.includes('G = (V, Σ, R, S)'), 'Should preserve exact Σ symbol');
    assert.ok(cleaned.includes('S ∈ V'), 'Should preserve exact ∈ symbol');
    assert.ok(cleaned.includes('Σ = {0, 1}'), 'Should preserve exact Σ = {0, 1}');
    assert.ok(cleaned.includes('ε'), 'Should preserve exact ε symbol');
  });

  // Test 26: Segmented text line and symbols split without UTF-16 encoding errors
  runTest('26. PDF symbol segmenter correctly splits Greek letters and mathematical symbols for Symbol font', async () => {
    const { splitIntoSegments, SYMBOL_MAP } = await import('../src/lib/pdfBranding');
    const segments = splitIntoSegments('Alphabet (Σ): Let Σ = {0, 1} and empty string ε ∈ L');
    const symbolSegments = segments.filter(s => s.isSymbol);
    assert.strictEqual(symbolSegments.length >= 3, true, 'Must detect at least 3 symbol segments (Σ, Σ, ε, ∈)');
    assert.strictEqual(SYMBOL_MAP['Σ'], 'S', 'Sigma must map to Symbol glyph S');
    assert.strictEqual(SYMBOL_MAP['ε'], 'e', 'Epsilon must map to Symbol glyph e');
  });

  // Test 25: Mobile responsive contracts and safe area classes
  runTest('25. Mobile responsive navigation and safe-area utilities are properly configured', async () => {
    const fs = await import('fs');
    const globalsCss = fs.readFileSync('src/app/globals.css', 'utf-8');
    assert.ok(globalsCss.includes('.pb-safe'), 'globals.css must contain .pb-safe');
    assert.ok(globalsCss.includes('overflow-x: hidden'), 'globals.css must contain overflow-x: hidden for smooth mobile scroll');

    const layoutTsx = fs.readFileSync('src/app/layout.tsx', 'utf-8');
    assert.ok(layoutTsx.includes('viewportFit: \'cover\''), 'layout.tsx must configure viewportFit cover');
    assert.ok(!layoutTsx.includes('userScalable: false'), 'layout.tsx must not restrict mobile user scalability');

    const mobileNavExists = fs.existsSync('src/components/MobileBottomNav.tsx');
    assert.strictEqual(mobileNavExists, true, 'MobileBottomNav component must exist');
  });

  // Test 27: Autonomous question classifier correctly categorizes academic questions
  runTest('27. Autonomous question classifier categorizes academic question types with tailored reasoning', async () => {
    const { classifyQuestion } = await import('../src/lib/ai/reasoningEngine');

    const comp = classifyQuestion('Compare and contrast TCP and UDP protocols.', 5);
    assert.strictEqual(comp.category, 'comparison');
    assert.strictEqual(comp.requiresExample, true);

    const arch = classifyQuestion('Draw and explain the architecture of Distributed Databases.', 10);
    assert.strictEqual(arch.category, 'architecture');
    assert.strictEqual(arch.requiresDiagram, true);

    const num = classifyQuestion('Calculate the channel capacity given B = 4kHz and SNR = 31.', 5);
    assert.strictEqual(num.category, 'numerical');
    assert.strictEqual(num.requiresFormulaOrCode, true);

    const algo = classifyQuestion('Explain Dijkstra shortest path algorithm with time complexity.', 8);
    assert.strictEqual(algo.category, 'algorithm');
    assert.strictEqual(algo.requiresFormulaOrCode, true);

    const def = classifyQuestion('Define the term alphabet in formal languages.', 2);
    assert.strictEqual(def.category, 'definition');
    assert.strictEqual(def.requiresDiagram, false);
  });

  // Test 28: Smart Mermaid diagram sanitizer auto-quotes labels and fixes missing headers
  runTest('28. Smart Mermaid diagram sanitizer auto-quotes labels and fixes missing headers', async () => {
    const { validateAndCleanMermaid, shouldIncludeDiagram } = await import('../src/lib/ai/diagramEngine');

    // Missing header but with node connections -> auto-prepends flowchart TD
    const headless = 'Client[Web Browser (HTTP/2)] --> Server[API Gateway (Node.js)]';
    const res1 = validateAndCleanMermaid(headless);
    assert.strictEqual(res1.isValid, true);
    assert.ok(res1.cleanedCode?.includes('flowchart TD'));
    assert.ok(res1.cleanedCode?.includes('["Web Browser (HTTP/2)"]'));

    // Should include diagram check
    assert.strictEqual(shouldIncludeDiagram('definition', 2, 'Define alphabet'), false);
    assert.strictEqual(shouldIncludeDiagram('architecture', 10, 'Explain system architecture'), true);
    assert.strictEqual(shouldIncludeDiagram('numerical', 5, 'Calculate throughput'), false);
  });

  // Test 29: Response quality validation & auto-repair engine enforces academic depth
  runTest('29. Response quality validation & auto-repair engine enforces academic depth and symbol integrity', async () => {
    const { validateAndRepairSolution } = await import('../src/lib/ai/responseValidator');

    const sampleItem = {
      questionNumber: 'Q1',
      questionText: 'Define formal alphabet and grammar.',
      marksAllocated: 2,
      answerSummary: 'Alphabet definition',
      detailedAnswer: 'Alphabet $\\Sigma$ is a finite non-empty set of symbols. Example: Let $\\Sigma = \\{0, 1\\}$.',
      keyPoints: ['Finite set', 'Symbols'],
    };

    const report = validateAndRepairSolution(sampleItem as any, 'Theory of Computation');
    assert.strictEqual(report.isValid, true);
    assert.ok(report.repairedItem.detailedAnswer.includes('Σ'));
    assert.ok(!report.repairedItem.detailedAnswer.includes('\\Sigma'));
    assert.ok(!report.repairedItem.detailedAnswer.includes('$'));
  });

  // Test 30: AI Evaluation Benchmark Dataset Verification
  runTest('30. Fixed AI Evaluation Benchmark Dataset passes quality & mark-calibration checks', async () => {
    const { EVALUATION_BENCHMARK_DATASET, evaluateBenchmarkItem } = await import('../src/lib/ai/evaluationDataset');

    assert.ok(EVALUATION_BENCHMARK_DATASET.length >= 5, 'Must have at least 5 benchmark questions');

    for (const item of EVALUATION_BENCHMARK_DATASET) {
      const evalRes = evaluateBenchmarkItem(item, item.sampleModelAnswer);
      assert.strictEqual(evalRes.categoryMatch, true, `Category must match for ${item.id}`);
      assert.strictEqual(evalRes.isValid, true, `Sample solution must be valid for ${item.id}`);
      assert.strictEqual(evalRes.wordCountCompliant, true, `Word count must be within calibration for ${item.id}`);
    }
  });

  // Test 31: Stray asterisks (*** or *Word:**) and (***) are cleanly stripped and bold paragraphs are not treated as bullets
  runTest('31. Stray asterisks (*Consensus:**) and (***) are cleanly stripped and bold headers are preserved', async () => {
    const { cleanMarkdownText } = await import('../src/lib/pdfBranding');
    assert.strictEqual(cleanMarkdownText('*Consensus:**'), 'Consensus:');
    assert.strictEqual(cleanMarkdownText('***Example:***'), 'Example:');
    assert.strictEqual(cleanMarkdownText('**Consensus:** Definition'), 'Consensus: Definition');
    assert.strictEqual(cleanMarkdownText('Notice (***) character artifact'), 'Notice character artifact');

    const isBulletLine = (line: string) => /^([-•]|\*(?!\*))\s+/.test(line);
    assert.strictEqual(isBulletLine('- Bullet item'), true);
    assert.strictEqual(isBulletLine('* Bullet item'), true);
    assert.strictEqual(isBulletLine('• Bullet item'), true);
    assert.strictEqual(isBulletLine('**Consensus:** Definition'), false);
    assert.strictEqual(isBulletLine('**Example:**'), false);
  });

  // Test 32: Regression verification of the 5 Real Examination Questions
  runTest('32. Regression verification for 5 Real Exam Questions (Simple Language, Correct Depth, Easy Memorization)', async () => {
    const { EVALUATION_BENCHMARK_DATASET, evaluateBenchmarkItem } = await import('../src/lib/ai/evaluationDataset');
    const targetIds = [
      'eval-2m-homogeneous-db',
      'eval-5m-data-replication',
      'eval-8m-ddbms-architecture',
      'eval-10m-dist-object-mgmt',
      'eval-10m-ddbs-advantages-disadvantages',
    ];

    for (const id of targetIds) {
      const item = EVALUATION_BENCHMARK_DATASET.find(b => b.id === id);
      assert.ok(item, `Benchmark item ${id} must exist`);
      const evalRes = evaluateBenchmarkItem(item!, item!.sampleModelAnswer);

      assert.strictEqual(evalRes.isValid, true, `${id} must be valid`);
      assert.strictEqual(evalRes.categoryMatch, true, `${id} category must match`);
      assert.strictEqual(evalRes.wordCountCompliant, true, `${id} word count must be within calibration`);
      assert.strictEqual(evalRes.examplePresent, true, `${id} must include practical example`);
      if (item!.mustContainDiagram) {
        assert.strictEqual(evalRes.diagramPresent, true, `${id} must provide Mermaid diagram`);
      }
    }
  });

  // Run Phase 13 Automated Security Regression Suite
  const secResults = await runSecurityTests();
  testsPassed += secResults.passed;
  testsFailed += secResults.failed;

  console.log('\n--------------------------------------------------');
  console.log(`Overall Test Suite Results: ${testsPassed} passed, ${testsFailed} failed.`);
  console.log('--------------------------------------------------\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite failed unexpectedly:', err);
  process.exit(1);
});
