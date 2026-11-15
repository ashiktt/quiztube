import { NextRequest, NextResponse } from 'next/server';
import { getUserUsageSummary, getAuthenticatedUser } from '@/lib/serverSubscription';
import { isValidId, sanitizeQueryInput } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);

    let effectiveUserId: string | undefined = authUser?.id;
    let effectiveEmail: string | undefined = authUser?.email;

    // Only verified administrators may query arbitrary user subscriptions
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
    return NextResponse.json({ success: true, ...summary });
  } catch (error: any) {
    console.error('API /api/user/subscription error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscription status.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));

    let effectiveUserId: string | undefined = authUser?.id;
    let effectiveEmail: string | undefined = authUser?.email;

    if (authUser?.isAdmin) {
      if (body.userId && isValidId(body.userId)) {
        effectiveUserId = body.userId;
        effectiveEmail = undefined;
      } else if (body.userEmail || body.email) {
        effectiveEmail = sanitizeQueryInput(body.userEmail || body.email);
        effectiveUserId = undefined;
      }
    }

    const summary = await getUserUsageSummary(effectiveUserId, effectiveEmail);
    return NextResponse.json({ success: true, ...summary });
  } catch (error: any) {
    console.error('API /api/user/subscription POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscription status.' },
      { status: 500 }
    );
  }
}
