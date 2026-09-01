import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { LectureStudySet } from '@/types';

// Helper to map DB row to LectureStudySet
function mapRowToStudySet(row: any): LectureStudySet {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    videoUrl: row.video_url || '',
    videoId: row.video_id || '',
    videoTitle: row.video_title || 'Untitled Lecture',
    channelTitle: row.channel_title || 'Educational Material',
    thumbnailUrl: row.thumbnail_url || '',
    durationFormatted: row.duration_formatted || '',
    difficulty: row.difficulty || 'medium',
    overallSummary: row.overall_summary || '',
    keyTakeaways: Array.isArray(row.key_takeaways) ? row.key_takeaways : [],
    chapters: Array.isArray(row.chapters) ? row.chapters : [],
    questions: Array.isArray(row.questions) ? row.questions : [],
    flashcards: Array.isArray(row.flashcards) ? row.flashcards : [],
    cheatsheet: row.cheatsheet || undefined,
    attempts: Array.isArray(row.attempts) ? row.attempts : [],
  };
}

// Helper to map LectureStudySet to DB row
function mapStudySetToRow(set: LectureStudySet): any {
  return {
    id: set.id,
    user_id: set.userId || null,
    created_at: set.createdAt || new Date().toISOString(),
    video_url: set.videoUrl,
    video_id: set.videoId,
    video_title: set.videoTitle,
    channel_title: set.channelTitle,
    thumbnail_url: set.thumbnailUrl,
    duration_formatted: set.durationFormatted,
    difficulty: set.difficulty,
    overall_summary: set.overallSummary,
    key_takeaways: set.keyTakeaways || [],
    chapters: set.chapters || [],
    questions: set.questions || [],
    flashcards: set.flashcards || [],
    cheatsheet: set.cheatsheet || null,
    attempts: set.attempts || [],
  };
}

/**
 * GET /api/study-sets?userId=...
 * Fetches study sets from Supabase, optionally filtered by student userId
 */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      studySets: [],
      message: 'Supabase credentials not configured in environment variables.',
    });
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ connected: false, studySets: [] });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let query = supabase
      .from('study_sets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ connected: true, error: error.message, studySets: [] }, { status: 500 });
    }

    const studySets = (data || []).map(mapRowToStudySet);
    return NextResponse.json({ connected: true, studySets });
  } catch (err: any) {
    console.error('API /api/study-sets GET error:', err);
    return NextResponse.json({ connected: false, error: err.message, studySets: [] }, { status: 500 });
  }
}

/**
 * POST /api/study-sets
 * Upserts a student study set in Supabase
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      saved: false,
      message: 'Supabase credentials not configured. Saving to local storage only.',
    });
  }

  try {
    const studySet: LectureStudySet = await req.json();
    if (!studySet || !studySet.id || !studySet.videoTitle) {
      return NextResponse.json({ error: 'Invalid study set payload' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ connected: false, saved: false });
    }

    const row = mapStudySetToRow(studySet);
    const { data, error } = await supabase
      .from('study_sets')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ connected: true, saved: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ connected: true, saved: true, studySet: mapRowToStudySet(data) });
  } catch (err: any) {
    console.error('API /api/study-sets POST error:', err);
    return NextResponse.json({ connected: false, saved: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/study-sets?id=...
 * Deletes a study set from Supabase
 */
export async function DELETE(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ connected: false, deleted: false });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing study set id' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ connected: false, deleted: false });
    }

    const { error } = await supabase.from('study_sets').delete().eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ connected: true, deleted: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ connected: true, deleted: true });
  } catch (err: any) {
    console.error('API /api/study-sets DELETE error:', err);
    return NextResponse.json({ connected: false, deleted: false, error: err.message }, { status: 500 });
  }
}
