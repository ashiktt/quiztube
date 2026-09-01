import { NextRequest, NextResponse } from 'next/server';
import { solveUniversityQuestionsWithGemini } from '@/lib/geminiSolver';
import { formatGeminiErrorMessage } from '@/lib/gemini';
import { UniversityExamRequest } from '@/types';

export async function POST(req: NextRequest) {
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
    } = body;

    const hasText = questionsText && questionsText.trim().length >= 5;
    const hasFile = fileBase64 && fileMimeType;

    if (!hasText && !hasFile) {
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
    });
  } catch (error: any) {
    console.error('Solve exam API error:', error);
    const friendlyError = formatGeminiErrorMessage(error);
    return NextResponse.json(
      { error: friendlyError },
      { status: 500 }
    );
  }
}
