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
    } = body;

    if (!questionsText || questionsText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please enter one or more university exam questions to solve.' },
        { status: 400 }
      );
    }

    const solvedExam = await solveUniversityQuestionsWithGemini({
      questionsText: questionsText.trim(),
      subject: subject?.trim() || 'University Examination',
      academicLevel: academicLevel || 'Undergraduate / B.Tech / BSC',
      customApiKey: apiKey,
      preferredModel,
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
