import { NextRequest, NextResponse } from 'next/server';
import { generateTutorResponse } from '@/lib/geminiTutor';
import { TutorChatRequest } from '@/types';
import { formatGeminiErrorMessage } from '@/lib/gemini';

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

    // Call Gemini Tutor Engine
    const tutorMessage = await generateTutorResponse(body);

    return NextResponse.json({
      success: true,
      message: tutorMessage,
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
