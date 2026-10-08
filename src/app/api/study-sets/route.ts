import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
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
 * GET /api/study-sets?userId=...
 * Fetches study sets from MongoDB, optionally filtered by student userId
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

    const docs = await StudySet.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const studySets = docs.map(mapDocToStudySet);
    return NextResponse.json({ connected: true, studySets });
  } catch (err: any) {
    console.error('API /api/study-sets GET error:', err);
    return NextResponse.json({ connected: false, error: err.message, studySets: [] }, { status: 500 });
  }
}

/**
 * POST /api/study-sets
 * Upserts a student study set in MongoDB
 */
export async function POST(req: NextRequest) {
  try {
    const studySet: LectureStudySet = await req.json();
    if (!studySet || !studySet.id || !studySet.videoTitle) {
      return NextResponse.json({ error: 'Invalid study set payload' }, { status: 400 });
    }

    await connectDB();
    const authUser = await getAuthenticatedUser(req);

    const updateData: any = {
      id: studySet.id,
      videoUrl: studySet.videoUrl || '',
      videoId: studySet.videoId || '',
      videoTitle: studySet.videoTitle,
      channelTitle: studySet.channelTitle || '',
      thumbnailUrl: studySet.thumbnailUrl || '',
      durationFormatted: studySet.durationFormatted || '',
      difficulty: studySet.difficulty || 'medium',
      overallSummary: studySet.overallSummary || '',
      keyTakeaways: studySet.keyTakeaways || [],
      chapters: studySet.chapters || [],
      questions: studySet.questions || [],
      flashcards: studySet.flashcards || [],
      cheatsheet: studySet.cheatsheet || null,
      attempts: studySet.attempts || [],
    };

    if (authUser?.id) {
      updateData.userId = authUser.id;
    } else if (studySet.userId) {
      updateData.userId = studySet.userId;
    }

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
    return NextResponse.json({ connected: false, saved: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/study-sets?id=...
 * Deletes a study set from MongoDB
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing study set id' }, { status: 400 });
    }

    await connectDB();
    await StudySet.deleteOne({ id });

    return NextResponse.json({ connected: true, deleted: true });
  } catch (err: any) {
    console.error('API /api/study-sets DELETE error:', err);
    return NextResponse.json({ connected: false, deleted: false, error: err.message }, { status: 500 });
  }
}
