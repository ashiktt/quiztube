-- Supabase Schema & Auth for QuizTube AI
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/hagqafhhjlvqfugsoqdo/sql)

-- 1. Create the study_sets table (with user_id support)
CREATE TABLE IF NOT EXISTS public.study_sets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  video_url TEXT,
  video_id TEXT,
  video_title TEXT NOT NULL,
  channel_title TEXT,
  thumbnail_url TEXT,
  duration_formatted TEXT,
  difficulty TEXT DEFAULT 'medium',
  overall_summary TEXT,
  key_takeaways JSONB DEFAULT '[]'::jsonb,
  chapters JSONB DEFAULT '[]'::jsonb,
  questions JSONB DEFAULT '[]'::jsonb,
  flashcards JSONB DEFAULT '[]'::jsonb,
  cheatsheet JSONB,
  attempts JSONB DEFAULT '[]'::jsonb
);

-- If you previously created the table, run this column migration:
ALTER TABLE public.study_sets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive policy for student study sets access
DROP POLICY IF EXISTS "Public Read Access" ON public.study_sets;
DROP POLICY IF EXISTS "Public Insert/Update Access" ON public.study_sets;

CREATE POLICY "Public Read Access" 
ON public.study_sets 
FOR SELECT 
USING (true);

CREATE POLICY "Public Insert/Update Access" 
ON public.study_sets 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Create indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_study_sets_created_at ON public.study_sets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sets_video_id ON public.study_sets (video_id);
CREATE INDEX IF NOT EXISTS idx_study_sets_user_id ON public.study_sets (user_id);
