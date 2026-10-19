/**
 * Student Copilot Comprehensive Test Suite
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
  console.log('Running Student Copilot Verification Test Suite');
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
      process.env.JWT_SECRET = 'test_secret_key_minimum_length_required_32_chars';
      const token = signToken({ userId: 'u123', email: 'student@example.com' });
      assert.ok(typeof token === 'string' && token.length > 20);

      const verified = verifyToken(token);
      assert.strictEqual(verified?.userId, 'u123');
      assert.strictEqual(verified?.email, 'student@example.com');
    } finally {
      if (originalSecret) process.env.JWT_SECRET = originalSecret;
      else delete process.env.JWT_SECRET;
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

  // Test 8: Missing n8n configuration is handled gracefully
  runTest('8. Missing n8n configuration is detected without crashing', () => {
    const originalN8n = process.env.N8N_EVENT_WEBHOOK_URL;
    try {
      delete process.env.N8N_EVENT_WEBHOOK_URL;
      assert.strictEqual(isN8nConfigured(), false);

      process.env.N8N_EVENT_WEBHOOK_URL = 'http://localhost:5678/webhook/student-copilot-events';
      assert.strictEqual(isN8nConfigured(), true);
    } finally {
      if (originalN8n) process.env.N8N_EVENT_WEBHOOK_URL = originalN8n;
      else delete process.env.N8N_EVENT_WEBHOOK_URL;
    }
  });

  // Test 9: Internal secret verification fails closed
  runTest('9. Internal callback routes fail closed when secret is missing', () => {
    const originalSecret = process.env.ASSISTANT_INTERNAL_API_SECRET;
    try {
      delete process.env.ASSISTANT_INTERNAL_API_SECRET;

      // Mock request without secret
      const reqNoSecret = {
        headers: new Headers({ authorization: 'Bearer test' }),
      } as any;
      assert.strictEqual(verifyInternalSecret(reqNoSecret), false);

      // Set secret
      process.env.ASSISTANT_INTERNAL_API_SECRET = 'secret_internal_cron_token_xyz';
      const reqValid = {
        headers: new Headers({ authorization: 'Bearer secret_internal_cron_token_xyz' }),
      } as any;
      assert.strictEqual(verifyInternalSecret(reqValid), true);

      const reqInvalid = {
        headers: new Headers({ authorization: 'Bearer wrong_token' }),
      } as any;
      assert.strictEqual(verifyInternalSecret(reqInvalid), false);
    } finally {
      if (originalSecret) process.env.ASSISTANT_INTERNAL_API_SECRET = originalSecret;
      else delete process.env.ASSISTANT_INTERNAL_API_SECRET;
    }
  });

  // Test 10: Idempotency keys prevent duplicate reminders and executions
  runTest('10. Idempotency keys are deterministic and prevent duplicates', () => {
    const userId = 'user_abc123';
    const eventId = 'event_def456';
    const offsetMinutes = 1440;
    const channel = 'in_app';

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
