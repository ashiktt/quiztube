import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { connectDB } from '@/lib/mongodb';
import { StudentReminder } from '@/models/StudentReminder';
import { StudentEvent } from '@/models/StudentEvent';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const eventId = searchParams.get('eventId');

    const filter: Record<string, unknown> = { userId: authUser.id };
    if (status) filter.status = status;
    if (eventId) filter.eventId = eventId;

    const reminders = await StudentReminder.find(filter)
      .populate('eventId', 'title eventType startAt')
      .sort({ scheduledAt: 1 })
      .limit(100)
      .lean();

    const formatted = reminders.map((r) => {
      const event = r.eventId as unknown as { _id?: string; title?: string };
      return {
        id: r._id.toString(),
        eventId: event?._id ? event._id.toString() : (r.eventId ? r.eventId.toString() : ''),
        eventTitle: event?.title || 'Academic Event',
        userId: r.userId,
        offsetMinutes: r.offsetMinutes,
        scheduledAt: r.scheduledAt.toISOString(),
        timezone: r.timezone,
        channel: r.channel,
        status: r.status,
        attemptCount: r.attemptCount,
        lastError: r.lastError,
        deliveredAt: r.deliveredAt ? r.deliveredAt.toISOString() : undefined,
        idempotencyKey: r.idempotencyKey,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, reminders: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve reminders.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { eventId, offsetMinutes, channel = 'in_app' } = body;

    if (!eventId || typeof offsetMinutes !== 'number' || offsetMinutes < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid eventId and offsetMinutes are required.' },
        { status: 400 }
      );
    }

    // Verify user owns the event
    const event = await StudentEvent.findOne({ _id: eventId, userId: authUser.id });
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 });
    }

    const scheduledAt = new Date(event.startAt.getTime() - offsetMinutes * 60000);
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${authUser.id}:${eventId}:${offsetMinutes}:${channel}:${Date.now()}`)
      .digest('hex');

    const reminder = await StudentReminder.create({
      eventId,
      userId: authUser.id,
      offsetMinutes,
      scheduledAt,
      timezone: event.timezone,
      channel: channel === 'email' ? 'email' : 'in_app',
      status: 'scheduled',
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      reminder: {
        id: reminder._id.toString(),
        eventTitle: event.title,
        ...reminder.toObject(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create reminder.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
