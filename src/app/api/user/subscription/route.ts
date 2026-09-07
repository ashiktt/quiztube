import { NextRequest, NextResponse } from 'next/server';
import { getUserUsageSummary, getAuthenticatedUser } from '@/lib/serverSubscription';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const userId = authUser?.id || searchParams.get('userId') || undefined;
    const userEmail = authUser?.email || searchParams.get('email') || searchParams.get('userEmail') || undefined;

    const summary = await getUserUsageSummary(userId, userEmail);
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
    const userId = authUser?.id || body.userId || undefined;
    const userEmail = authUser?.email || body.userEmail || body.email || undefined;

    const summary = await getUserUsageSummary(userId, userEmail);
    return NextResponse.json({ success: true, ...summary });
  } catch (error: any) {
    console.error('API /api/user/subscription POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscription status.' },
      { status: 500 }
    );
  }
}
