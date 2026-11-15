import { NextRequest, NextResponse } from 'next/server';
import { generateTutorResponse } from '@/lib/geminiTutor';
import { TutorChatRequest } from '@/types';
import { formatGeminiErrorMessage, isValidGeminiApiKey } from '@/lib/gemini';
import { checkAndReserveDailyQuota, getAuthenticatedUser } from '@/lib/serverSubscription';
import { enforceRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const authUser = await getAuthenticatedUser(req);
    const effectiveUserId = authUser?.id;
    const effectiveUserEmail = authUser?.email;

    // Rate limiting: 60 tutor requests per hour
    const rateLimit = await enforceRateLimit(`tutor:${effectiveUserId || ip}`, 60, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    const body: TutorChatRequest = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least one message for the AI Tutor.' },
        { status: 400 }
      );
    }

    if (body.messages.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Conversation history exceeds maximum of 50 messages.' },
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

    // Sanitize and cap latest message
    if (latestMsg.content) {
      latestMsg.content = latestMsg.content.replace(/\0/g, '').slice(0, 5000);
    }

    // Validate BYOK API key if provided
    if (body.apiKey) {
      if (!isValidGeminiApiKey(body.apiKey)) {
        return NextResponse.json(
          { success: false, error: 'Invalid Gemini API key format. Expected standard Google AI Studio key format.' },
          { status: 400 }
        );
      }
    }

    // Validate image attachment if provided
    if (body.imageFileBase64) {
      const MAX_IMG_LENGTH = 14 * 1024 * 1024;
      if (body.imageFileBase64.length > MAX_IMG_LENGTH) {
        return NextResponse.json(
          { success: false, error: 'Attached image exceeds maximum size limit of 10MB.' },
          { status: 400 }
        );
      }
    }

    // Server-side Pro Verification for AI Tutor
    const quotaCheck = await checkAndReserveDailyQuota({
      userId: effectiveUserId,
      userEmail: effectiveUserEmail,
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
    console.error('API /api/tutor POST error:', error?.message || error);
    const formatted = formatGeminiErrorMessage(error);
    return NextResponse.json(
      { success: false, error: formatted },
      { status: 500 }
    );
  }
}
