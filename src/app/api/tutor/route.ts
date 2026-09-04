import { NextRequest, NextResponse } from 'next/server';
import { generateTutorResponse } from '@/lib/geminiTutor';
import { TutorChatRequest } from '@/types';
import { formatGeminiErrorMessage } from '@/lib/gemini';
import { checkAndReserveDailyQuota } from '@/lib/serverSubscription';

export async function POST(req: NextRequest) {
  try {
    const body: TutorChatRequest = await req.json();

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least one message for the AI Tutor.' },
        { status: 400 }
      );
    }

    const latestMsg = body.messages[body.messages.length - 1];
    if (!latestMsg || (!latestMsg.content?.trim() && !body.imageFileBase64)) {
      return NextResponse.json(
        { success: false, error: 'Message content or an image attachment is required.' },
        { status: 400 }
      );
    }

    // Server-side Pro Verification for AI Tutor
    const quotaCheck = await checkAndReserveDailyQuota({
      userId: body.userId,
      featureType: 'tutor',
      hasCustomApiKey: Boolean(body.apiKey),
    });

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.message || 'QuizTube AI Tutor is a Pro feature.',
          proRequired: true,
          reason: quotaCheck.reason,
        },
        { status: 403 }
      );
    }

    // Call Gemini Tutor Engine
    const tutorMessage = await generateTutorResponse(body);

    return NextResponse.json({
      success: true,
      message: tutorMessage,
      isPro: quotaCheck.isPro,
    });
  } catch (error: any) {
    console.error('API /api/tutor POST error:', error);
    const formatted = formatGeminiErrorMessage(error);
    return NextResponse.json(
      { success: false, error: formatted },
      { status: 500 }
    );
  }
}
