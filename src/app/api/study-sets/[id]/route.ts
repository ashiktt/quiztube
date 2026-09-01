import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { LectureStudySet } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing study set id' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('study_sets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Study set not found' }, { status: 404 });
    }

    const studySet: LectureStudySet = {
      id: data.id,
      createdAt: data.created_at || new Date().toISOString(),
      videoUrl: data.video_url || '',
      videoId: data.video_id || '',
      videoTitle: data.video_title || 'Untitled Lecture',
      channelTitle: data.channel_title || 'Educational Material',
      thumbnailUrl: data.thumbnail_url || '',
      durationFormatted: data.duration_formatted || '',
      difficulty: data.difficulty || 'medium',
      overallSummary: data.overall_summary || '',
      keyTakeaways: Array.isArray(data.key_takeaways) ? data.key_takeaways : [],
      chapters: Array.isArray(data.chapters) ? data.chapters : [],
      questions: Array.isArray(data.questions) ? data.questions : [],
      flashcards: Array.isArray(data.flashcards) ? data.flashcards : [],
      cheatsheet: data.cheatsheet || undefined,
      attempts: Array.isArray(data.attempts) ? data.attempts : [],
    };

    return NextResponse.json({ studySet });
  } catch (err: any) {
    console.error('API /api/study-sets/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
