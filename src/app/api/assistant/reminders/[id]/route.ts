import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { connectDB } from '@/lib/mongodb';
import { StudentReminder } from '@/models/StudentReminder';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await connectDB();

    const reminder = await StudentReminder.findOne({ _id: id, userId: authUser.id });
    if (!reminder) {
      return NextResponse.json({ success: false, error: 'Reminder not found.' }, { status: 404 });
    }

    const body = await req.json();

    if (body.status !== undefined) {
      if (!['scheduled', 'delivered', 'failed', 'cancelled'].includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Invalid reminder status.' }, { status: 400 });
      }
      reminder.status = body.status;
      if (body.status === 'delivered') {
        reminder.deliveredAt = new Date();
      }
    }

    if (body.channel !== undefined) {
      reminder.channel = body.channel === 'email' ? 'email' : 'in_app';
    }

    await reminder.save();

    return NextResponse.json({
      success: true,
      reminder: { id: reminder._id.toString(), ...reminder.toObject() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update reminder.';
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

    const reminder = await StudentReminder.findOneAndDelete({ _id: id, userId: authUser.id });
    if (!reminder) {
      return NextResponse.json({ success: false, error: 'Reminder not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Reminder deleted successfully.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete reminder.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
