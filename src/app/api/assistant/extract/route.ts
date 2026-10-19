import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { extractAcademicEventWithGemini } from '@/lib/assistant/geminiEventParser';
import { checkRateLimit } from '@/lib/assistant/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to extract academic events.' },
        { status: 401 }
      );
    }

    // Rate limiting (20 requests per minute per user)
    const rateCheck = checkRateLimit(`extract:${authUser.id}`, 20, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please wait a minute before submitting more academic material.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateCheck.resetMs / 1000)) },
        }
      );
    }

    const body = await req.json();
    const { text, fileBase64, fileMimeType, userTimezone, apiKey } = body;

    if (!text && !fileBase64) {
      return NextResponse.json(
        { success: false, error: 'Please provide notice text, timetable, syllabus or an attached document.' },
        { status: 400 }
      );
    }

    const proposal = await extractAcademicEventWithGemini({
      text,
      fileBase64,
      fileMimeType,
      userTimezone: userTimezone || 'Asia/Kolkata',
      customApiKey: apiKey,
    });

    return NextResponse.json({
      success: true,
      proposal,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to extract academic event.';
    console.error('Extraction API error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
