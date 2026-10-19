import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { connectDB } from '@/lib/mongodb';
import { StudentEvent } from '@/models/StudentEvent';
import { StudentTask } from '@/models/StudentTask';
import { StudentReminder } from '@/models/StudentReminder';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [allTasks, upcomingExams, upcomingAssignments, upcomingReminders, activeEventsCount] =
      await Promise.all([
        StudentTask.find({ userId: authUser.id }).sort({ dueDate: 1 }).lean(),
        StudentEvent.find({
          userId: authUser.id,
          eventType: 'exam',
          status: { $in: ['confirmed', 'scheduled', 'needs_confirmation'] },
          startAt: { $gte: startOfToday },
        })
          .sort({ startAt: 1 })
          .limit(10)
          .lean(),
        StudentEvent.find({
          userId: authUser.id,
          eventType: { $in: ['assignment', 'project_deadline'] },
          status: { $in: ['confirmed', 'scheduled', 'needs_confirmation'] },
          startAt: { $gte: startOfToday },
        })
          .sort({ startAt: 1 })
          .limit(10)
          .lean(),
        StudentReminder.find({
          userId: authUser.id,
          status: 'scheduled',
          scheduledAt: { $gte: now },
        })
          .populate('eventId', 'title eventType startAt')
          .sort({ scheduledAt: 1 })
          .limit(15)
          .lean(),
        StudentEvent.countDocuments({
          userId: authUser.id,
          status: { $in: ['confirmed', 'scheduled', 'needs_confirmation'] },
        }),
      ]);

    const todayTasks = allTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) >= startOfToday &&
        new Date(t.dueDate) <= endOfToday &&
        t.status !== 'completed'
    );

    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < startOfToday && t.status !== 'completed'
    );

    const pendingTasks = allTasks.filter((t) => t.status === 'pending');
    const completedTasks = allTasks.filter((t) => t.status === 'completed');
    const totalTasks = allTasks.length;
    const completionRatePercent =
      totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 100;

    const formattedReminders = upcomingReminders.map((r) => {
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

    return NextResponse.json({
      success: true,
      planner: {
        todayTasks: todayTasks.map((t) => ({ id: t._id.toString(), ...t })),
        upcomingExams: upcomingExams.map((e) => ({ id: e._id.toString(), ...e })),
        upcomingAssignments: upcomingAssignments.map((a) => ({ id: a._id.toString(), ...a })),
        upcomingReminders: formattedReminders,
        overdueTasks: overdueTasks.map((t) => ({ id: t._id.toString(), ...t })),
        stats: {
          totalActiveEvents: activeEventsCount,
          pendingTasksCount: pendingTasks.length,
          upcomingRemindersCount: upcomingReminders.length,
          completionRatePercent,
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve planner overview.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
