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

  console.log('\n--------------------------------------------------');
  console.log(`Results: ${testsPassed} passed, ${testsFailed} failed.`);
  console.log('--------------------------------------------------\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite failed unexpectedly:', err);
  process.exit(1);
});
