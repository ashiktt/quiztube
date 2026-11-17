import { NextRequest, NextResponse } from 'next/server';
import { processSolutionFollowUp } from '@/lib/ai/conversationalEngine';
import { formatGeminiErrorMessage, isValidGeminiApiKey } from '@/lib/gemini';
import { checkAndReserveDailyQuota, rollbackDailyQuota, getAuthenticatedUser } from '@/lib/serverSubscription';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let reservedQuota = false;
  let requestUserId: string | null = null;

  try {
    const authUser = await getAuthenticatedUser(req);
    const effectiveUserId = authUser?.id || null;
    const effectiveUserEmail = authUser?.email || null;
    requestUserId = effectiveUserId;

    const body = await req.json();
    const {
      questionNumber,
      originalQuestion,
      originalAnswer,
      followUpPrompt,
      subject,
      academicLevel,
      apiKey,
      preferredModel,
      history,
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

    if (!followUpPrompt || typeof followUpPrompt !== 'string' || followUpPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please enter a valid follow-up question or instruction.' },
        { status: 400 }
      );
    }

    if (!originalQuestion || !originalAnswer) {
      return NextResponse.json(
        { error: 'Missing question context for this follow-up inquiry.' },
        { status: 400 }
      );
    }

    // Rate-limit check & reserve quota (tutor/question_solver quota)
    const quotaCheck = await checkAndReserveDailyQuota({
      userId: effectiveUserId || undefined,
      userEmail: effectiveUserEmail || undefined,
      featureType: 'question_solver',
      hasCustomApiKey: Boolean(apiKey),
    });

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.message || 'Daily AI inquiry limit reached.',
          reason: quotaCheck.reason,
          limitReached: quotaCheck.reason === 'limit_reached',
        },
        { status: 403 }
      );
    }

    reservedQuota = true;

    const cleanFollowUp = followUpPrompt.replace(/\0/g, '').trim().slice(0, 3000);
    const cleanOriginalQ = originalQuestion.replace(/\0/g, '').trim().slice(0, 5000);
    const cleanOriginalA = originalAnswer.replace(/\0/g, '').trim().slice(0, 10000);

    const result = await processSolutionFollowUp({
      questionNumber: questionNumber ? String(questionNumber).slice(0, 50) : undefined,
      originalQuestion: cleanOriginalQ,
      originalAnswer: cleanOriginalA,
      followUpPrompt: cleanFollowUp,
      subject: subject ? String(subject).slice(0, 200) : undefined,
      academicLevel: academicLevel ? String(academicLevel).slice(0, 100) : undefined,
      apiKey,
      preferredModel,
      history: Array.isArray(history) ? history.slice(-6) : [],
    });

    return NextResponse.json({
      success: true,
      answer: result.answer,
      suggestedFollowUps: result.suggestedFollowUps,
      diagramMermaid: result.diagramMermaid,
      remainingQuota: quotaCheck.remaining,
      isPro: quotaCheck.isPro,
    });
  } catch (error: any) {
    console.error('Follow-up route error:', error?.message || error);
    if (reservedQuota && requestUserId) {
      await rollbackDailyQuota({ userId: requestUserId, featureType: 'question_solver' });
    }
    const friendlyError = formatGeminiErrorMessage(error);
    return NextResponse.json({ error: friendlyError }, { status: 500 });
  }
}
