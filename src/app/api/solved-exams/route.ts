import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { UniversitySolvedExam } from '@/types';

// Helper to map DB row to UniversitySolvedExam
function mapRowToSolvedExam(row: any): UniversitySolvedExam {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    subject: row.subject || 'University Examination',
    academicLevel: row.academic_level || 'Undergraduate',
    totalMarks: Number(row.total_marks) || 0,
    rawQuestionsText: row.raw_questions_text || '',
    overallExamSummary: row.overall_exam_summary || '',
    solutions: Array.isArray(row.solutions) ? row.solutions : [],
  };
}

// Helper to map UniversitySolvedExam to DB row
function mapSolvedExamToRow(exam: UniversitySolvedExam): any {
  return {
    id: exam.id,
    user_id: exam.userId || null,
    created_at: exam.createdAt || new Date().toISOString(),
    subject: exam.subject,
    academic_level: exam.academicLevel,
    total_marks: exam.totalMarks,
    raw_questions_text: exam.rawQuestionsText,
    overall_exam_summary: exam.overallExamSummary,
    solutions: exam.solutions || [],
  };
}

/**
 * GET /api/solved-exams?userId=...
 * Fetches solved exam papers from Supabase
 */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      solvedExams: [],
      message: 'Supabase credentials not configured.',
    });
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ connected: false, solvedExams: [] });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let query = supabase
      .from('solved_exams')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      console.warn('Supabase solved_exams query:', error.message);
      return NextResponse.json({ connected: true, solvedExams: [] });
    }

    const solvedExams = (data || []).map(mapRowToSolvedExam);
    return NextResponse.json({ connected: true, solvedExams });
  } catch (err: any) {
    console.error('API /api/solved-exams GET error:', err);
    return NextResponse.json({ connected: false, error: err.message, solvedExams: [] }, { status: 500 });
  }
}

/**
 * POST /api/solved-exams
 * Upserts a solved exam paper in Supabase
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      saved: false,
      message: 'Supabase not configured. Saved to local storage only.',
    });
  }

  try {
    const exam: UniversitySolvedExam = await req.json();
    if (!exam || !exam.id || !exam.subject) {
      return NextResponse.json({ error: 'Invalid solved exam payload' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ connected: false, saved: false });
    }

    const row = mapSolvedExamToRow(exam);
    const { data, error } = await supabase
      .from('solved_exams')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase solved_exams upsert error:', error.message);
      return NextResponse.json({ connected: true, saved: false, error: error.message });
    }

    return NextResponse.json({ connected: true, saved: true, solvedExam: mapRowToSolvedExam(data) });
  } catch (err: any) {
    console.error('API /api/solved-exams POST error:', err);
    return NextResponse.json({ connected: false, saved: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/solved-exams?id=...
 * Deletes a solved exam paper from Supabase
 */
export async function DELETE(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ connected: false, deleted: false });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing solved exam id' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ connected: false, deleted: false });
    }

    const { error } = await supabase.from('solved_exams').delete().eq('id', id);

    if (error) {
      console.warn('Supabase solved_exams delete error:', error.message);
      return NextResponse.json({ connected: true, deleted: false, error: error.message });
    }

    return NextResponse.json({ connected: true, deleted: true });
  } catch (err: any) {
    console.error('API /api/solved-exams DELETE error:', err);
    return NextResponse.json({ connected: false, deleted: false, error: err.message }, { status: 500 });
  }
}
