import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { connectDB } from '@/lib/mongodb';
import { StudentEvent } from '@/models/StudentEvent';
import { StudentTask } from '@/models/StudentTask';
import { StudentReminder } from '@/models/StudentReminder';
import { dispatchAutomationAction } from '@/lib/assistant/n8nClient';
import crypto from 'crypto';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await connectDB();

    const event = await StudentEvent.findOne({ _id: id, userId: authUser.id });
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 });
    }

    // Optional confirmation overrides from user
    const body = await req.json().catch(() => ({}));

    if (body.title) event.title = String(body.title).trim();
    if (body.description !== undefined) event.description = String(body.description).trim();
    if (body.location !== undefined) event.location = String(body.location).trim();
    if (body.startAt) {
      const parsed = new Date(body.startAt);
      if (!isNaN(parsed.getTime())) event.startAt = parsed;
    }

    // Advance event status: draft / needs_confirmation -> confirmed -> scheduled
    event.status = 'confirmed';
    await event.save();

    // Query tasks and reminders for dispatch
    const [tasks, reminders] = await Promise.all([
      StudentTask.find({ eventId: id, userId: authUser.id }).lean(),
      StudentReminder.find({ eventId: id, userId: authUser.id }).lean(),
    ]);

    // Dispatch event.confirmed automation via n8n
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`event.confirmed:${authUser.id}:${id}:${event.updatedAt.getTime()}`)
      .digest('hex');

    const automationResult = await dispatchAutomationAction({
      userId: authUser.id,
      eventId: id,
      actionType: 'event.confirmed',
      payload: {
        eventId: id,
        title: event.title,
        eventType: event.eventType,
        description: event.description,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt?.toISOString(),
        timezone: event.timezone,
        location: event.location,
        taskCount: tasks.length,
        reminderCount: reminders.length,
      },
      idempotencyKey,
    });

    event.status = 'scheduled';
    await event.save();

    return NextResponse.json({
      success: true,
      message: 'Event confirmed and scheduled successfully.',
      event: {
        id: event._id.toString(),
        ...event.toObject(),
        tasks: tasks.map((t) => ({ id: t._id.toString(), ...t })),
        reminders: reminders.map((r) => ({ id: r._id.toString(), ...r })),
      },
      automation: automationResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to confirm event.';
    console.error('Confirm event error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
