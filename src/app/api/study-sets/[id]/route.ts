import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isValidId } from '@/lib/mongodb';
import { StudySet } from '@/models/StudySet';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { LectureStudySet } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required to view study set' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id || !isValidId(id)) {
      return NextResponse.json({ error: 'Valid study set ID is required' }, { status: 400 });
    }

    await connectDB();
    const data = await StudySet.findOne({ id }).lean();

    if (!data) {
      return NextResponse.json({ error: 'Study set not found' }, { status: 404 });
    }

    // Ownership or admin check
    if (data.userId && data.userId !== authUser.id && !authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this study set' },
        { status: 403 }
      );
    }

    const studySet: LectureStudySet = {
      id: data.id,
      userId: data.userId || undefined,
      createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
      videoUrl: data.videoUrl || '',
      videoId: data.videoId || '',
      videoTitle: data.videoTitle || 'Untitled Lecture',
      channelTitle: data.channelTitle || 'Educational Material',
      thumbnailUrl: data.thumbnailUrl || '',
      durationFormatted: data.durationFormatted || '',
      difficulty: (data.difficulty as any) || 'medium',
      overallSummary: data.overallSummary || '',
      keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [],
      chapters: Array.isArray(data.chapters) ? data.chapters : [],
      questions: Array.isArray(data.questions) ? data.questions : [],
      flashcards: Array.isArray(data.flashcards) ? data.flashcards : [],
      cheatsheet: data.cheatsheet || undefined,
      attempts: Array.isArray(data.attempts) ? data.attempts : [],
    };

    return NextResponse.json({ studySet });
  } catch (err: any) {
    console.error('API /api/study-sets/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to retrieve study set' }, { status: 500 });
  }
}
