import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isValidId, sanitizeQueryInput } from '@/lib/mongodb';
import { TutorConversation } from '@/models/TutorConversation';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { TutorConversation as ITutorConvType } from '@/types';

// Helper to map Mongoose doc to TutorConversation type
function mapDocToConversation(doc: any): ITutorConvType {
  return {
    id: doc.id,
    userId: doc.userId || undefined,
    title: doc.title || 'Tutoring Session',
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    messages: Array.isArray(doc.messages) ? doc.messages : [],
    context: doc.context || undefined,
    explanationMode: doc.explanationMode || 'simple',
    learningMode: doc.learningMode || 'direct',
  };
}

/**
 * GET /api/tutor/conversations
 * Fetches tutoring conversations strictly for the authenticated student
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { connected: false, error: 'Authentication required to access tutor conversations' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const targetUserIdParam = searchParams.get('userId');

    let targetUserId = authUser.id;
    if (authUser.isAdmin && targetUserIdParam) {
      const sanitized = sanitizeQueryInput(targetUserIdParam);
      if (isValidId(sanitized)) {
        targetUserId = sanitized;
      }
    }

    const docs = await TutorConversation.find({ userId: targetUserId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const conversations = docs.map(mapDocToConversation);
    return NextResponse.json({ connected: true, conversations });
  } catch (err: any) {
    console.error('API /api/tutor/conversations GET error:', err);
    return NextResponse.json(
      { connected: false, error: err.message || 'Failed to fetch conversations', conversations: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tutor/conversations
 * Upserts a tutoring conversation strictly bound to the authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { connected: false, error: 'Authentication required to save conversations' },
        { status: 401 }
      );
    }

    const conv: ITutorConvType = await req.json().catch(() => null);
    if (!conv || !conv.id || !conv.title) {
      return NextResponse.json({ error: 'Invalid conversation payload' }, { status: 400 });
    }

    if (!isValidId(conv.id)) {
      return NextResponse.json({ error: 'Invalid conversation ID format' }, { status: 400 });
    }

    await connectDB();

    // Check ownership before overwriting an existing conversation
    const existing = await TutorConversation.findOne({ id: conv.id });
    if (existing && existing.userId && existing.userId !== authUser.id && !authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to modify this conversation' },
        { status: 403 }
      );
    }

    const updateData: any = {
      id: conv.id,
      userId: authUser.id, // Strictly bound to authenticated session
      title: typeof conv.title === 'string' ? conv.title.slice(0, 200) : 'Tutoring Session',
      messages: Array.isArray(conv.messages) ? conv.messages : [],
      context: conv.context || null,
      explanationMode: conv.explanationMode || 'simple',
      learningMode: conv.learningMode || 'direct',
      updatedAt: new Date(),
    };

    const updatedDoc = await TutorConversation.findOneAndUpdate(
      { id: conv.id },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      connected: true,
      saved: true,
      conversation: mapDocToConversation(updatedDoc),
    });
  } catch (err: any) {
    console.error('API /api/tutor/conversations POST error:', err);
    return NextResponse.json(
      { connected: false, saved: false, error: err.message || 'Failed to save conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tutor/conversations?id=...
 * Deletes a tutoring conversation with strict ownership verification
 */
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { connected: false, error: 'Authentication required to delete conversations' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get('id');
    const id = sanitizeQueryInput(rawId);

    if (!id || !isValidId(id)) {
      return NextResponse.json({ error: 'Valid conversation ID is required' }, { status: 400 });
    }

    await connectDB();

    const existing = await TutorConversation.findOne({ id });
    if (!existing) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (existing.userId && existing.userId !== authUser.id && !authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this conversation' },
        { status: 403 }
      );
    }

    await TutorConversation.deleteOne({ id });

    return NextResponse.json({ connected: true, deleted: true });
  } catch (err: any) {
    console.error('API /api/tutor/conversations DELETE error:', err);
    return NextResponse.json(
      { connected: false, deleted: false, error: err.message || 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
