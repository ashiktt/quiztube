-- Supabase Schema for QuizTube AI
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create the study_sets table
CREATE TABLE IF NOT EXISTS public.study_sets (
  id TEXT PRIMARY KEY,
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

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive policy for public read/write access (suitable for client study sets)
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
