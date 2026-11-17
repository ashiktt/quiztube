import { NextRequest, NextResponse } from 'next/server';
import { solveUniversityQuestionsWithGemini } from '@/lib/geminiSolver';
import { formatGeminiErrorMessage, isValidGeminiApiKey } from '@/lib/gemini';
import { checkAndReserveDailyQuota, rollbackDailyQuota, getAuthenticatedUser } from '@/lib/serverSubscription';
import { UniversityExamRequest } from '@/types';
import { enforceRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';

export const maxDuration = 60; // Max Vercel serverless execution duration in seconds

/**
 * Validates uploaded file size, mime type, and magic bytes signature
 */
function validateUploadedFile(fileBase64: string, fileMimeType: string): { valid: boolean; error?: string } {
  // Max size: 10MB (base64 string length ~13.7MB)
  const MAX_BASE64_LENGTH = 14 * 1024 * 1024;
  if (fileBase64.length > MAX_BASE64_LENGTH) {
    return { valid: false, error: 'File size exceeds maximum allowed limit of 10MB.' };
  }

  const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
  if (!allowedMimeTypes.includes(fileMimeType)) {
    return { valid: false, error: 'Unsupported file type. Only PDF and images (PNG, JPEG, WebP) are allowed.' };
  }

  const rawBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');

  if (fileMimeType === 'application/pdf' && !rawBase64.startsWith('JVBERi0')) {
    return { valid: false, error: 'Invalid PDF file. Header signature does not match PDF specification.' };
  }
  if (fileMimeType === 'image/png' && !rawBase64.startsWith('iVBORw0KGgo')) {
    return { valid: false, error: 'Invalid PNG file. Header signature does not match PNG specification.' };
  }
  if (fileMimeType === 'image/jpeg' && !rawBase64.startsWith('/9j/')) {
    return { valid: false, error: 'Invalid JPEG file. Header signature does not match JPEG specification.' };
  }
  if (fileMimeType === 'image/webp' && !rawBase64.startsWith('UklGR')) {
    return { valid: false, error: 'Invalid WebP file. Header signature does not match WebP specification.' };
  }

  return { valid: true };
}

export async function POST(req: NextRequest) {
  let reservedQuota = false;
  let requestUserId: string | undefined = undefined;

  try {
    const ip = getClientIp(req);
    const authUser = await getAuthenticatedUser(req);
    const effectiveUserId = authUser?.id;
    const effectiveUserEmail = authUser?.email;
    requestUserId = effectiveUserId;

    // Rate limiting: 20 exam solve requests per hour
    const rateLimit = await enforceRateLimit(`solve_exam:${effectiveUserId || ip}`, 20, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    const body: UniversityExamRequest = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const {
      questionsText,
      subject,
      academicLevel,
      apiKey,
      preferredModel,
      fileBase64,
      fileMimeType,
      fileName,
    } = body;

    // Validate BYOK API key if provided
    if (apiKey) {
      if (!isValidGeminiApiKey(apiKey)) {
        return NextResponse.json(
          { error: 'Invalid Gemini API key format. Expected standard Google AI Studio key format.' },
          { status: 400 }
        );
      }
    }

    // Server-side Quota & Subscription Verification (Asia/Kolkata timezone)
    const quotaCheck = await checkAndReserveDailyQuota({
      userId: effectiveUserId,
      userEmail: effectiveUserEmail,
      featureType: 'question_solver',
      hasCustomApiKey: Boolean(apiKey),
    });

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.message || 'Daily Question Solver limit reached.',
          reason: quotaCheck.reason,
          limitReached: quotaCheck.reason === 'limit_reached',
          proRequired: quotaCheck.reason === 'pro_required',
          authRequired: quotaCheck.reason === 'auth_required',
        },
        { status: 403 }
      );
    }

    reservedQuota = true;

    // Validate uploaded file if present
    if (fileBase64 && fileMimeType) {
      const fileValidation = validateUploadedFile(fileBase64, fileMimeType);
      if (!fileValidation.valid) {
        if (reservedQuota) await rollbackDailyQuota({ userId: requestUserId, featureType: 'question_solver' });
        return NextResponse.json({ error: fileValidation.error }, { status: 400 });
      }
    }

    // Validate input text
    const cleanQuestions = questionsText ? String(questionsText).replace(/\0/g, '').trim() : '';
    if (cleanQuestions.length > 50000) {
      if (reservedQuota) await rollbackDailyQuota({ userId: requestUserId, featureType: 'question_solver' });
      return NextResponse.json(
        { error: 'Questions text is too long. Maximum allowed length is 50,000 characters.' },
        { status: 400 }
      );
    }

    const hasText = cleanQuestions.length >= 5;
    const hasFile = Boolean(fileBase64 && fileMimeType);

    if (!hasText && !hasFile) {
      if (reservedQuota) {
        await rollbackDailyQuota({ userId: requestUserId, featureType: 'question_solver' });
      }
      return NextResponse.json(
        { error: 'Please enter university exam questions or upload a question paper PDF/Image.' },
        { status: 400 }
      );
    }

    const cleanSubject = subject ? String(subject).slice(0, 200).trim() : 'University Examination';
    const cleanAcademicLevel = academicLevel ? String(academicLevel).slice(0, 100) : 'Undergraduate / B.Tech / BSC';

    const solvedExam = await solveUniversityQuestionsWithGemini({
      questionsText: cleanQuestions || undefined,
      subject: cleanSubject,
      academicLevel: cleanAcademicLevel,
      customApiKey: apiKey,
      preferredModel,
      fileBase64,
      fileMimeType,
      fileName: fileName ? String(fileName).slice(0, 150) : undefined,
    });

    return NextResponse.json({
      success: true,
      solvedExam,
      remainingQuota: quotaCheck.remaining,
      isPro: quotaCheck.isPro,
    });
  } catch (error: any) {
    console.error('Solve exam API error:', error?.message || error);
    // Rollback daily quota on failure
    if (reservedQuota && requestUserId) {
      await rollbackDailyQuota({ userId: requestUserId, featureType: 'question_solver' });
    }
    const friendlyError = formatGeminiErrorMessage(error);
    return NextResponse.json(
      { error: friendlyError },
      { status: 500 }
    );
  }
}
