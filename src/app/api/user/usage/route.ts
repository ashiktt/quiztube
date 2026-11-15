import { NextRequest, NextResponse } from 'next/server';
import { getUserUsageSummary, getAuthenticatedUser } from '@/lib/serverSubscription';
import { isValidId, sanitizeQueryInput } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);

    let effectiveUserId: string | undefined = authUser?.id;
    let effectiveEmail: string | undefined = authUser?.email;

    // Only verified administrators may inspect other users' usage summaries
    if (authUser?.isAdmin) {
      const queryUserId = searchParams.get('userId');
      const queryEmail = searchParams.get('email') || searchParams.get('userEmail');
      if (queryUserId && isValidId(queryUserId)) {
        effectiveUserId = queryUserId;
        effectiveEmail = undefined;
      } else if (queryEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(queryEmail)) {
        effectiveEmail = sanitizeQueryInput(queryEmail);
        effectiveUserId = undefined;
      }
    }

    const summary = await getUserUsageSummary(effectiveUserId, effectiveEmail);
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
