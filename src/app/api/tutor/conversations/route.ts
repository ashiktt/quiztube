import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
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
 * GET /api/tutor/conversations?userId=...
 * Fetches tutoring conversations from MongoDB
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const userId = authUser?.id || searchParams.get('userId');

    let filter: any = {};
    if (userId) {
      filter = { $or: [{ userId }, { userId: null }, { userId: { $exists: false } }] };
    }

    const docs = await TutorConversation.find(filter)
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const conversations = docs.map(mapDocToConversation);
    return NextResponse.json({ connected: true, conversations });
  } catch (err: any) {
    console.error('API /api/tutor/conversations GET error:', err);
    return NextResponse.json({ connected: false, error: err.message, conversations: [] }, { status: 500 });
  }
}

/**
 * POST /api/tutor/conversations
 * Upserts a tutoring conversation in MongoDB
 */
export async function POST(req: NextRequest) {
  try {
    const conv: ITutorConvType = await req.json();
    if (!conv || !conv.id || !conv.title) {
      return NextResponse.json({ error: 'Invalid conversation payload' }, { status: 400 });
    }

    await connectDB();
    const authUser = await getAuthenticatedUser(req);

    const updateData: any = {
      id: conv.id,
      title: conv.title,
      messages: conv.messages || [],
      context: conv.context || null,
      explanationMode: conv.explanationMode || 'simple',
      learningMode: conv.learningMode || 'direct',
      updatedAt: new Date(),
    };

    if (authUser?.id) {
      updateData.userId = authUser.id;
    } else if (conv.userId) {
      updateData.userId = conv.userId;
    }

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
    return NextResponse.json({ connected: false, saved: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/tutor/conversations?id=...
 * Deletes a tutoring conversation from MongoDB
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });
    }

    await connectDB();
    await TutorConversation.deleteOne({ id });

    return NextResponse.json({ connected: true, deleted: true });
  } catch (err: any) {
    console.error('API /api/tutor/conversations DELETE error:', err);
    return NextResponse.json({ connected: false, deleted: false, error: err.message }, { status: 500 });
  }
}
