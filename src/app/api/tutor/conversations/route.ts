import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { TutorConversation } from '@/types';

// Helper to map DB row to TutorConversation
function mapRowToConversation(row: any): TutorConversation {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    title: row.title || 'Tutoring Session',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    messages: Array.isArray(row.messages) ? row.messages : [],
    context: row.context || undefined,
    explanationMode: row.explanation_mode || 'simple',
    learningMode: row.learning_mode || 'direct',
  };
}

// Helper to map TutorConversation to DB row
function mapConversationToRow(conv: TutorConversation): any {
  return {
    id: conv.id,
    user_id: conv.userId || null,
    title: conv.title,
    created_at: conv.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    messages: conv.messages || [],
    context: conv.context || null,
    explanation_mode: conv.explanationMode || 'simple',
    learning_mode: conv.learningMode || 'direct',
  };
}

/**
 * GET /api/tutor/conversations?userId=...
 */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      conversations: [],
      message: 'Supabase credentials not configured.',
    });
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ connected: false, conversations: [] });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let query = supabase
      .from('tutor_conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase tutor_conversations query:', error.message);
      return NextResponse.json({ connected: true, conversations: [] });
    }

    const conversations = (data || []).map(mapRowToConversation);
    return NextResponse.json({ connected: true, conversations });
  } catch (err: any) {
    console.error('API /api/tutor/conversations GET error:', err);
    return NextResponse.json({ connected: false, error: err.message, conversations: [] }, { status: 500 });
  }
}

/**
 * POST /api/tutor/conversations
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
    const conv: TutorConversation = await req.json();
    if (!conv || !conv.id || !conv.title) {
      return NextResponse.json({ error: 'Invalid conversation payload' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ connected: false, saved: false });
    }

    const row = mapConversationToRow(conv);
    const { data, error } = await supabase
      .from('tutor_conversations')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase tutor_conversations upsert error:', error.message);
      return NextResponse.json({ connected: true, saved: false, error: error.message });
    }

    return NextResponse.json({ connected: true, saved: true, conversation: mapRowToConversation(data) });
  } catch (err: any) {
    console.error('API /api/tutor/conversations POST error:', err);
    return NextResponse.json({ connected: false, saved: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/tutor/conversations?id=...
 */
export async function DELETE(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ connected: false, deleted: false });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ connected: false, deleted: false });
    }

    const { error } = await supabase.from('tutor_conversations').delete().eq('id', id);

    if (error) {
      console.warn('Supabase tutor_conversations delete error:', error.message);
      return NextResponse.json({ connected: true, deleted: false, error: error.message });
    }

    return NextResponse.json({ connected: true, deleted: true });
  } catch (err: any) {
    console.error('API /api/tutor/conversations DELETE error:', err);
    return NextResponse.json({ connected: false, deleted: false, error: err.message }, { status: 500 });
  }
}
