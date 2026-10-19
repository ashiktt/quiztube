import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { connectDB } from '@/lib/mongodb';
import { StudentTask } from '@/models/StudentTask';
import { sanitizeString } from '@/lib/assistant/eventValidation';

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

    const task = await StudentTask.findOne({ _id: id, userId: authUser.id });
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found.' }, { status: 404 });
    }

    const body = await req.json();

    if (body.title !== undefined) {
      const cleanTitle = sanitizeString(body.title, 250);
      if (cleanTitle) task.title = cleanTitle;
    }
    if (body.description !== undefined) {
      task.description = sanitizeString(body.description, 2000);
    }
    if (body.status !== undefined) {
      task.status = body.status;
    }
    if (body.priority !== undefined) {
      task.priority = body.priority;
    }
    if (body.dueDate !== undefined) {
      task.dueDate = body.dueDate ? new Date(body.dueDate) : undefined;
    }
    if (typeof body.estimatedMinutes === 'number') {
      task.estimatedMinutes = Math.max(5, Math.min(1440, body.estimatedMinutes));
    }

    await task.save();

    return NextResponse.json({
      success: true,
      task: { id: task._id.toString(), ...task.toObject() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update task.';
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

    const task = await StudentTask.findOneAndDelete({ _id: id, userId: authUser.id });
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete task.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
