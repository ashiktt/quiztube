import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isValidId, sanitizeQueryInput } from '@/lib/mongodb';
import { StudySet } from '@/models/StudySet';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { LectureStudySet } from '@/types';

// Helper to map Mongoose doc to LectureStudySet
function mapDocToStudySet(doc: any): LectureStudySet {
  return {
    id: doc.id,
    userId: doc.userId || undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    videoUrl: doc.videoUrl || '',
    videoId: doc.videoId || '',
    videoTitle: doc.videoTitle || 'Untitled Lecture',
    channelTitle: doc.channelTitle || 'Educational Material',
    thumbnailUrl: doc.thumbnailUrl || '',
    durationFormatted: doc.durationFormatted || '',
    difficulty: doc.difficulty || 'medium',
    overallSummary: doc.overallSummary || '',
    keyTakeaways: Array.isArray(doc.keyTakeaways) ? doc.keyTakeaways : [],
    chapters: Array.isArray(doc.chapters) ? doc.chapters : [],
    questions: Array.isArray(doc.questions) ? doc.questions : [],
    flashcards: Array.isArray(doc.flashcards) ? doc.flashcards : [],
    cheatsheet: doc.cheatsheet || undefined,
    attempts: Array.isArray(doc.attempts) ? doc.attempts : [],
  };
}

/**
 * GET /api/study-sets
 * Fetches study sets strictly for the authenticated student.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { connected: false, error: 'Authentication required to access study sets' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const targetUserIdParam = searchParams.get('userId');

    // Non-admin students may only access their own study sets
    let targetUserId = authUser.id;
    if (authUser.isAdmin && targetUserIdParam) {
      const sanitized = sanitizeQueryInput(targetUserIdParam);
      if (isValidId(sanitized)) {
        targetUserId = sanitized;
      }
    }

    const docs = await StudySet.find({ userId: targetUserId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const studySets = docs.map(mapDocToStudySet);
    return NextResponse.json({ connected: true, studySets });
  } catch (err: any) {
    console.error('API /api/study-sets GET error:', err);
    return NextResponse.json(
      { connected: false, error: err.message || 'Failed to fetch study sets', studySets: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/study-sets
 * Upserts a study set bound strictly to the authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { connected: false, error: 'Authentication required to save study sets' },
        { status: 401 }
      );
    }

    const studySet: LectureStudySet = await req.json().catch(() => null);
    if (!studySet || !studySet.id || !studySet.videoTitle) {
      return NextResponse.json({ error: 'Invalid study set payload' }, { status: 400 });
    }

    if (!isValidId(studySet.id)) {
      return NextResponse.json({ error: 'Invalid study set ID format' }, { status: 400 });
    }

    await connectDB();

    // Check ownership before overwriting an existing study set
    const existing = await StudySet.findOne({ id: studySet.id });
    if (existing && existing.userId && existing.userId !== authUser.id && !authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to modify this study set' },
        { status: 403 }
      );
    }

    const updateData: any = {
      id: studySet.id,
      userId: authUser.id, // Strictly bind to authenticated user session
      videoUrl: typeof studySet.videoUrl === 'string' ? studySet.videoUrl : '',
      videoId: typeof studySet.videoId === 'string' ? studySet.videoId : '',
      videoTitle: typeof studySet.videoTitle === 'string' ? studySet.videoTitle.slice(0, 300) : 'Untitled Lecture',
      channelTitle: typeof studySet.channelTitle === 'string' ? studySet.channelTitle.slice(0, 150) : '',
      thumbnailUrl: typeof studySet.thumbnailUrl === 'string' ? studySet.thumbnailUrl : '',
      durationFormatted: typeof studySet.durationFormatted === 'string' ? studySet.durationFormatted : '',
      difficulty: studySet.difficulty || 'medium',
      overallSummary: typeof studySet.overallSummary === 'string' ? studySet.overallSummary : '',
      keyTakeaways: Array.isArray(studySet.keyTakeaways) ? studySet.keyTakeaways : [],
      chapters: Array.isArray(studySet.chapters) ? studySet.chapters : [],
      questions: Array.isArray(studySet.questions) ? studySet.questions : [],
      flashcards: Array.isArray(studySet.flashcards) ? studySet.flashcards : [],
      cheatsheet: studySet.cheatsheet || null,
      attempts: Array.isArray(studySet.attempts) ? studySet.attempts : [],
    };

    const updatedDoc = await StudySet.findOneAndUpdate(
      { id: studySet.id },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      connected: true,
      saved: true,
      studySet: mapDocToStudySet(updatedDoc),
    });
  } catch (err: any) {
    console.error('API /api/study-sets POST error:', err);
    return NextResponse.json(
      { connected: false, saved: false, error: err.message || 'Failed to save study set' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/study-sets?id=...
 * Deletes a study set with strict ownership verification.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { connected: false, error: 'Authentication required to delete study sets' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get('id');
    const id = sanitizeQueryInput(rawId);

    if (!id || !isValidId(id)) {
      return NextResponse.json({ error: 'Valid study set ID is required' }, { status: 400 });
    }

    await connectDB();

    const existing = await StudySet.findOne({ id });
    if (!existing) {
      return NextResponse.json({ error: 'Study set not found' }, { status: 404 });
    }

    // Verify ownership
    if (existing.userId && existing.userId !== authUser.id && !authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this study set' },
        { status: 403 }
      );
    }

    await StudySet.deleteOne({ id });

    return NextResponse.json({ connected: true, deleted: true });
  } catch (err: any) {
    console.error('API /api/study-sets DELETE error:', err);
    return NextResponse.json(
      { connected: false, deleted: false, error: err.message || 'Failed to delete study set' },
      { status: 500 }
    );
  }
}
