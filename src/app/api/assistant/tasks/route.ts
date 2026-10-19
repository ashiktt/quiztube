import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { connectDB } from '@/lib/mongodb';
import { StudentTask } from '@/models/StudentTask';
import { sanitizeString } from '@/lib/assistant/eventValidation';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const eventId = searchParams.get('eventId');

    const filter: Record<string, unknown> = { userId: authUser.id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (eventId) filter.eventId = eventId;

    const tasks = await StudentTask.find(filter)
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      tasks: tasks.map((t) => ({ id: t._id.toString(), ...t })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve tasks.';
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

    const title = sanitizeString(body.title, 250);
    if (!title) {
      return NextResponse.json({ success: false, error: 'Task title is required.' }, { status: 400 });
    }

    const task = await StudentTask.create({
      userId: authUser.id,
      eventId: body.eventId || undefined,
      title,
      description: sanitizeString(body.description, 2000),
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      estimatedMinutes: typeof body.estimatedMinutes === 'number' ? body.estimatedMinutes : 30,
    });

    return NextResponse.json({
      success: true,
      task: { id: task._id.toString(), ...task.toObject() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create task.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
