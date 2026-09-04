import { NextRequest, NextResponse } from 'next/server';
import { solveUniversityQuestionsWithGemini } from '@/lib/geminiSolver';
import { formatGeminiErrorMessage } from '@/lib/gemini';
import { checkAndReserveDailyQuota, rollbackDailyQuota } from '@/lib/serverSubscription';
import { UniversityExamRequest } from '@/types';

export async function POST(req: NextRequest) {
  let reservedQuota = false;
  let requestUserId: string | undefined = undefined;

  try {
    const body: UniversityExamRequest = await req.json();
    const {
      questionsText,
      subject,
      academicLevel,
      apiKey,
      preferredModel,
      fileBase64,
      fileMimeType,
      fileName,
      userId,
      userEmail,
    } = body;

    requestUserId = userId;

    // Server-side Quota & Subscription Verification (Asia/Kolkata timezone)
    const quotaCheck = await checkAndReserveDailyQuota({
      userId,
      userEmail,
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

    const hasText = questionsText && questionsText.trim().length >= 5;
    const hasFile = fileBase64 && fileMimeType;

    if (!hasText && !hasFile) {
      if (reservedQuota) {
        await rollbackDailyQuota({ userId: requestUserId, featureType: 'question_solver' });
      }
      return NextResponse.json(
        { error: 'Please enter university exam questions or upload a question paper PDF/Image.' },
        { status: 400 }
      );
    }

    const solvedExam = await solveUniversityQuestionsWithGemini({
      questionsText: questionsText?.trim(),
      subject: subject?.trim() || 'University Examination',
      academicLevel: academicLevel || 'Undergraduate / B.Tech / BSC',
      customApiKey: apiKey,
      preferredModel,
      fileBase64,
      fileMimeType,
      fileName,
    });

    return NextResponse.json({
      success: true,
      solvedExam,
      remainingQuota: quotaCheck.remaining,
      isPro: quotaCheck.isPro,
    });
  } catch (error: any) {
    console.error('Solve exam API error:', error);
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
