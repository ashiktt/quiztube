import { NextRequest, NextResponse } from 'next/server';
import { verifyInternalSecret } from '@/lib/assistant/internalAuth';
import { connectDB } from '@/lib/mongodb';
import { StudentReminder } from '@/models/StudentReminder';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    if (!verifyInternalSecret(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized internal access.' }, { status: 401 });
    }

    await connectDB();
    const now = new Date();

    // Query due reminders that are scheduled and scheduledAt is in the past or right now
    const dueReminders = await StudentReminder.find({
      status: 'scheduled',
      scheduledAt: { $lte: now },
    })
      .populate('eventId', 'title eventType description startAt timezone location')
      .limit(50);

    if (dueReminders.length === 0) {
      return NextResponse.json({ success: true, count: 0, reminders: [] });
    }

    // Collect user IDs for notification recipients
    const userIds = dueReminders.map((r) => r.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('email name').lean();
    const userMap = new Map<string, { email?: string; name?: string }>();
    for (const u of users) {
      userMap.set(u._id.toString(), { email: u.email, name: u.name });
    }

    const payload = dueReminders.map((r) => {
      const event = r.eventId as unknown as {
        _id?: string;
        title?: string;
        eventType?: string;
        description?: string;
        startAt?: Date;
        timezone?: string;
        location?: string;
      };
      const user = userMap.get(r.userId) || {};

      return {
        reminderId: r._id.toString(),
        userId: r.userId,
        userEmail: user.email || '',
        userName: user.name || 'Student',
        eventId: event?._id ? event._id.toString() : '',
        eventTitle: event?.title || 'Academic Event',
        eventType: event?.eventType || 'general',
        eventStartAt: event?.startAt ? event.startAt.toISOString() : '',
        eventLocation: event?.location || '',
        offsetMinutes: r.offsetMinutes,
        channel: r.channel,
        scheduledAt: r.scheduledAt.toISOString(),
        idempotencyKey: r.idempotencyKey,
      };
    });

    // Increment attempt count on fetched reminders
    const ids = dueReminders.map((r) => r._id);
    await StudentReminder.updateMany(
      { _id: { $in: ids } },
      { $inc: { attemptCount: 1 } }
    );

    return NextResponse.json({
      success: true,
      count: payload.length,
      reminders: payload,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error retrieving due reminders.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
