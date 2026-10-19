import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { connectDB } from '@/lib/mongodb';
import { StudentEvent } from '@/models/StudentEvent';
import { StudentTask } from '@/models/StudentTask';
import { StudentReminder } from '@/models/StudentReminder';
import { validateIsoDateString, sanitizeString } from '@/lib/assistant/eventValidation';
import { dispatchAutomationAction } from '@/lib/assistant/n8nClient';
import crypto from 'crypto';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await connectDB();

    const event = await StudentEvent.findOne({ _id: id, userId: authUser.id }).lean();
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 });
    }

    const [tasks, reminders] = await Promise.all([
      StudentTask.find({ eventId: id, userId: authUser.id }).lean(),
      StudentReminder.find({ eventId: id, userId: authUser.id }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      event: {
        id: event._id.toString(),
        ...event,
        tasks: tasks.map((t) => ({ id: t._id.toString(), ...t })),
        reminders: reminders.map((r) => ({ id: r._id.toString(), ...r })),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch event.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
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

    const body = await req.json();

    if (body.title !== undefined) {
      const cleanTitle = sanitizeString(body.title, 250);
      if (!cleanTitle) {
        return NextResponse.json({ success: false, error: 'Title cannot be empty.' }, { status: 400 });
      }
      event.title = cleanTitle;
    }

    if (body.eventType !== undefined) {
      event.eventType = body.eventType;
    }

    if (body.description !== undefined) {
      event.description = sanitizeString(body.description, 2000);
    }

    if (body.location !== undefined) {
      event.location = sanitizeString(body.location, 200);
    }

    let dateChanged = false;
    if (body.startAt !== undefined) {
      const parsed = validateIsoDateString(body.startAt);
      if (!parsed.isValid || !parsed.dateObj) {
        return NextResponse.json({ success: false, error: 'Invalid start date format.' }, { status: 400 });
      }
      event.startAt = parsed.dateObj;
      dateChanged = true;
    }

    if (body.endAt !== undefined) {
      if (body.endAt) {
        const parsed = validateIsoDateString(body.endAt);
        if (parsed.isValid && parsed.dateObj) {
          event.endAt = parsed.dateObj;
        }
      } else {
        event.endAt = undefined;
      }
    }

    if (body.status !== undefined) {
      event.status = body.status;
    }

    await event.save();

    // If date changed, update associated reminder scheduled times
    if (dateChanged) {
      const reminders = await StudentReminder.find({ eventId: id, userId: authUser.id });
      for (const rem of reminders) {
        const newScheduled = new Date(event.startAt.getTime() - rem.offsetMinutes * 60000);
        rem.scheduledAt = newScheduled;
        await rem.save();
      }
    }

    // Trigger event.updated automation dispatch if confirmed/scheduled
    if (event.status === 'confirmed' || event.status === 'scheduled') {
      const idempotencyKey = crypto
        .createHash('sha256')
        .update(`event.updated:${authUser.id}:${id}:${event.updatedAt.getTime()}`)
        .digest('hex');

      await dispatchAutomationAction({
        userId: authUser.id,
        eventId: id,
        actionType: 'event.updated',
        payload: {
          title: event.title,
          eventType: event.eventType,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt?.toISOString(),
          location: event.location,
        },
        idempotencyKey,
      }).catch((e) => console.warn('Automation dispatch warning:', e));
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event._id.toString(),
        ...event.toObject(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update event.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
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

    // Mark as cancelled or remove
    event.status = 'cancelled';
    await event.save();

    // Cancel related reminders
    await StudentReminder.updateMany(
      { eventId: id, userId: authUser.id },
      { status: 'cancelled' }
    );

    // Cancel related tasks
    await StudentTask.updateMany(
      { eventId: id, userId: authUser.id, status: { $ne: 'completed' } },
      { status: 'cancelled' }
    );

    // Dispatch event.cancelled automation
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`event.cancelled:${authUser.id}:${id}:${Date.now()}`)
      .digest('hex');

    await dispatchAutomationAction({
      userId: authUser.id,
      eventId: id,
      actionType: 'event.cancelled',
      payload: { title: event.title, eventId: id },
      idempotencyKey,
    }).catch((e) => console.warn('Automation dispatch warning:', e));

    return NextResponse.json({ success: true, message: 'Event successfully cancelled.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to cancel event.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
