import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { connectDB } from '@/lib/mongodb';
import { StudentEvent } from '@/models/StudentEvent';
import { StudentReminder } from '@/models/StudentReminder';
import { StudentTask } from '@/models/StudentTask';

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

    event.status = 'rejected';
    await event.save();

    // Cancel pending reminders & tasks
    await StudentReminder.updateMany(
      { eventId: id, userId: authUser.id },
      { status: 'cancelled' }
    );
    await StudentTask.updateMany(
      { eventId: id, userId: authUser.id },
      { status: 'cancelled' }
    );

    return NextResponse.json({
      success: true,
      message: 'Proposed academic event rejected.',
      eventId: id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reject event.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
