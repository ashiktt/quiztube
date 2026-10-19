import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { connectDB } from '@/lib/mongodb';
import { StudentEvent } from '@/models/StudentEvent';
import { StudentTask } from '@/models/StudentTask';
import { StudentReminder } from '@/models/StudentReminder';
import { validateEventProposal } from '@/lib/assistant/eventValidation';
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
    const eventType = searchParams.get('eventType');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    const filter: Record<string, unknown> = { userId: authUser.id };

    if (status) {
      filter.status = status;
    }
    if (eventType) {
      filter.eventType = eventType;
    }
    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) dateFilter.$lte = new Date(toDate);
      filter.startAt = dateFilter;
    }

    const events = await StudentEvent.find(filter)
      .sort({ startAt: 1 })
      .limit(limit)
      .lean();

    const eventIds = events.map((e) => e._id);

    // Fetch associated tasks and reminders
    const [tasks, reminders] = await Promise.all([
      StudentTask.find({ eventId: { $in: eventIds }, userId: authUser.id }).lean(),
      StudentReminder.find({ eventId: { $in: eventIds }, userId: authUser.id }).lean(),
    ]);

    const taskMap = new Map<string, typeof tasks>();
    for (const t of tasks) {
      const eid = t.eventId ? t.eventId.toString() : '';
      if (!taskMap.has(eid)) taskMap.set(eid, []);
      taskMap.get(eid)!.push(t);
    }

    const reminderMap = new Map<string, typeof reminders>();
    for (const r of reminders) {
      const eid = r.eventId ? r.eventId.toString() : '';
      if (!reminderMap.has(eid)) reminderMap.set(eid, []);
      reminderMap.get(eid)!.push(r);
    }

    const enriched = events.map((e) => {
      const eid = e._id.toString();
      return {
        id: eid,
        ...e,
        tasks: (taskMap.get(eid) || []).map((t) => ({ id: t._id.toString(), ...t })),
        reminders: (reminderMap.get(eid) || []).map((r) => ({ id: r._id.toString(), ...r })),
      };
    });

    return NextResponse.json({ success: true, events: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve events.';
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

    // Validate incoming data
    const validation = validateEventProposal(body, body.timezone);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid event data.', details: validation.errors },
        { status: 400 }
      );
    }

    const p = validation.sanitized;

    // Create event record strictly owned by authenticated user
    const newEvent = await StudentEvent.create({
      userId: authUser.id,
      title: p.title,
      eventType: p.eventType,
      description: p.description,
      startAt: new Date(p.startAt),
      endAt: p.endAt ? new Date(p.endAt) : undefined,
      timezone: p.timezone,
      location: p.location || '',
      status: p.needsConfirmation ? 'needs_confirmation' : 'draft',
      confidence: p.confidence,
      rawInputSnippet: body.rawInputSnippet ? String(body.rawInputSnippet).slice(0, 500) : '',
      metadata: {
        missingFields: p.missingFields,
        clarificationPrompt: p.clarificationPrompt,
        studyPlanSuggestions: p.studyPlanSuggestions,
      },
    });

    const eventId = newEvent._id.toString();

    // Create tasks if any
    const createdTasks = [];
    if (p.tasks && p.tasks.length > 0) {
      for (const taskTitle of p.tasks) {
        const task = await StudentTask.create({
          eventId: newEvent._id,
          userId: authUser.id,
          title: taskTitle,
          status: 'pending',
          priority: p.eventType === 'exam' ? 'high' : 'medium',
          dueDate: newEvent.startAt,
        });
        createdTasks.push({ id: task._id.toString(), ...task.toObject() });
      }
    }

    // Create reminders with idempotency keys
    const createdReminders = [];
    if (p.proposedReminders && p.proposedReminders.length > 0) {
      for (const rem of p.proposedReminders) {
        const scheduledTime = new Date(newEvent.startAt.getTime() - rem.offsetMinutes * 60000);
        const idempotencyKey = crypto
          .createHash('sha256')
          .update(`${authUser.id}:${eventId}:${rem.offsetMinutes}:${rem.channel || 'in_app'}`)
          .digest('hex');

        try {
          const reminder = await StudentReminder.create({
            eventId: newEvent._id,
            userId: authUser.id,
            offsetMinutes: rem.offsetMinutes,
            scheduledAt: scheduledTime,
            timezone: p.timezone,
            channel: rem.channel || 'in_app',
            status: 'scheduled',
            idempotencyKey,
          });
          createdReminders.push({ id: reminder._id.toString(), ...reminder.toObject() });
        } catch {
          // Ignore duplicate reminder constraint collision
        }
      }
    }

    return NextResponse.json({
      success: true,
      event: {
        id: eventId,
        ...newEvent.toObject(),
        tasks: createdTasks,
        reminders: createdReminders,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create academic event.';
    console.error('Create event error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
