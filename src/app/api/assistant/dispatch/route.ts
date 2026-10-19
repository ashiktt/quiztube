import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { connectDB } from '@/lib/mongodb';
import { StudentEvent } from '@/models/StudentEvent';
import { dispatchAutomationAction, ALLOWED_AUTOMATION_ACTIONS } from '@/lib/assistant/n8nClient';
import { checkRateLimit } from '@/lib/assistant/rateLimiter';
import { AssistantActionType } from '@/types/assistant';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit automation dispatches (30/min)
    const rateCheck = checkRateLimit(`dispatch:${authUser.id}`, 30, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Automation dispatch rate limit reached. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { actionType, eventId, payload = {} } = body;

    if (!ALLOWED_AUTOMATION_ACTIONS.includes(actionType as AssistantActionType)) {
      return NextResponse.json(
        { success: false, error: `Invalid or disallowed automation action: ${actionType}` },
        { status: 400 }
      );
    }

    await connectDB();

    // If eventId is given, verify ownership
    if (eventId) {
      const event = await StudentEvent.findOne({ _id: eventId, userId: authUser.id });
      if (!event) {
        return NextResponse.json({ success: false, error: 'Event not found or unauthorized.' }, { status: 404 });
      }
    }

    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`dispatch:${authUser.id}:${actionType}:${eventId || 'no-event'}:${Date.now()}`)
      .digest('hex');

    const result = await dispatchAutomationAction({
      userId: authUser.id,
      eventId,
      actionType: actionType as AssistantActionType,
      payload,
      idempotencyKey,
    });

    return NextResponse.json({ success: result.success, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to dispatch automation action.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
