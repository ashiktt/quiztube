import { NextRequest, NextResponse } from 'next/server';
import { getUserUsageSummary } from '@/lib/serverSubscription';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const userEmail = searchParams.get('email') || searchParams.get('userEmail') || undefined;

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
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || undefined;
    const userEmail = body.userEmail || body.email || undefined;

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
