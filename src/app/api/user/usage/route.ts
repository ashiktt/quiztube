import { NextRequest, NextResponse } from 'next/server';
import { getUserUsageSummary } from '@/lib/serverSubscription';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const userEmail = searchParams.get('email') || searchParams.get('userEmail') || undefined;

    const summary = await getUserUsageSummary(userId, userEmail);
    return NextResponse.json({
      success: true,
      quizAiUsed: summary.quizAiUsed,
      quizAiLimit: summary.quizAiLimit,
      quizAiRemaining: summary.quizAiRemaining,
      questionSolverUsed: summary.questionSolverUsed,
      questionSolverLimit: summary.questionSolverLimit,
      questionSolverRemaining: summary.questionSolverRemaining,
      isPro: summary.isPro,
      isAdmin: Boolean(summary.isAdmin),
      plan: summary.plan,
      subscription: summary.subscription,
      timezone: summary.timezone,
      date: summary.date,
    });
  } catch (error: any) {
    console.error('API /api/user/usage error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch usage data.' },
      { status: 500 }
    );
  }
}
