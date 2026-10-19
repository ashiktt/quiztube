import { NextRequest, NextResponse } from 'next/server';
import { verifyInternalSecret } from '@/lib/assistant/internalAuth';
import { connectDB } from '@/lib/mongodb';
import { StudentReminder } from '@/models/StudentReminder';

export async function POST(req: NextRequest) {
  try {
    if (!verifyInternalSecret(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized internal access.' }, { status: 401 });
    }

    const body = await req.json();
    const { reminderId, status, error, channel } = body;

    if (!reminderId || !['delivered', 'failed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid reminderId and status ("delivered" | "failed") are required.' },
        { status: 400 }
      );
    }

    await connectDB();
    const reminder = await StudentReminder.findById(reminderId);
    if (!reminder) {
      return NextResponse.json({ success: false, error: 'Reminder record not found.' }, { status: 404 });
    }

    // Prevent double delivery overwrite if already delivered
    if (reminder.status === 'delivered') {
      return NextResponse.json({
        success: true,
        message: 'Reminder was already marked delivered.',
        reminder: { id: reminder._id.toString(), ...reminder.toObject() },
      });
    }

    reminder.status = status;
    if (status === 'delivered') {
      reminder.deliveredAt = new Date();
      reminder.lastError = '';
    } else {
      reminder.lastError = error ? String(error).slice(0, 500) : 'Delivery failed';
    }

    if (channel) {
      reminder.channel = channel === 'email' ? 'email' : 'in_app';
    }

    await reminder.save();

    return NextResponse.json({
      success: true,
      message: `Reminder status recorded as ${status}.`,
      reminder: { id: reminder._id.toString(), ...reminder.toObject() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error recording delivery status.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
