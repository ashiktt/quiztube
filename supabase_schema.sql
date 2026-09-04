-- =========================================================
-- QuizTube AI - Comprehensive Supabase Database & Auth Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hagqafhhjlvqfugsoqdo/sql
-- =========================================================

-- 1. Create Student Profiles Table (Stores safe student metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert/update their own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert/update their own profile" 
ON public.profiles FOR ALL 
USING (auth.uid() = id OR auth.uid() IS NULL) 
WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- 2. Trigger to automatically create a student profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create Study Sets Table (Stores student YouTube quizzes, cheatsheets & scores)
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

ALTER TABLE public.study_sets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.study_sets;
DROP POLICY IF EXISTS "Public Insert/Update Access" ON public.study_sets;
CREATE POLICY "Public Read Access" ON public.study_sets FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Access" ON public.study_sets FOR ALL USING (true) WITH CHECK (true);

-- 4. Create Solved Exams Table (Stores student University Question Solver exam papers)
CREATE TABLE IF NOT EXISTS public.solved_exams (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  subject TEXT NOT NULL,
  academic_level TEXT DEFAULT 'Undergraduate',
  total_marks INTEGER DEFAULT 0,
  raw_questions_text TEXT,
  overall_exam_summary TEXT,
  solutions JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.solved_exams ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.solved_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Solved Exams Read" ON public.solved_exams;
DROP POLICY IF EXISTS "Public Solved Exams Write" ON public.solved_exams;
CREATE POLICY "Public Solved Exams Read" ON public.solved_exams FOR SELECT USING (true);
CREATE POLICY "Public Solved Exams Write" ON public.solved_exams FOR ALL USING (true) WITH CHECK (true);

-- 5. Create Tutor Conversations Table (Stores AI Tutor chats and context)
CREATE TABLE IF NOT EXISTS public.tutor_conversations (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  explanation_mode TEXT DEFAULT 'stepByStep',
  learning_mode TEXT DEFAULT 'guided',
  context JSONB,
  messages JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.tutor_conversations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tutor_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Tutor Conversations Read" ON public.tutor_conversations;
DROP POLICY IF EXISTS "Public Tutor Conversations Write" ON public.tutor_conversations;
CREATE POLICY "Public Tutor Conversations Read" ON public.tutor_conversations FOR SELECT USING (true);
CREATE POLICY "Public Tutor Conversations Write" ON public.tutor_conversations FOR ALL USING (true) WITH CHECK (true);

-- 6. Create Subscriptions Table (Stores QuizTube Pro ₹149/month student subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' NOT NULL, -- 'free', 'pro'
  status TEXT DEFAULT 'active' NOT NULL, -- 'active', 'expired', 'cancelled', 'pending'
  payment_provider TEXT DEFAULT 'razorpay',
  order_id TEXT,
  payment_id TEXT,
  subscription_id TEXT,
  amount INTEGER DEFAULT 14900, -- in paise (₹149 = 14900 paise)
  currency TEXT DEFAULT 'INR',
  start_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  expiry_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Subscriptions Read Access" ON public.subscriptions;
DROP POLICY IF EXISTS "Public Subscriptions Write Access" ON public.subscriptions;
CREATE POLICY "Public Subscriptions Read Access" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Public Subscriptions Write Access" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

-- 7. Create Daily AI Usage Table (Atomic server-side tracking of Free tier daily quotas)
CREATE TABLE IF NOT EXISTS public.daily_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL, -- 'quiz_ai', 'question_solver', 'tutor'
  usage_date DATE DEFAULT CURRENT_DATE NOT NULL, -- Date in Asia/Kolkata timezone
  prompt_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_feature_date UNIQUE (user_id, feature_type, usage_date)
);

ALTER TABLE public.daily_ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Daily Usage Read Access" ON public.daily_ai_usage;
DROP POLICY IF EXISTS "Public Daily Usage Write Access" ON public.daily_ai_usage;
CREATE POLICY "Public Daily Usage Read Access" ON public.daily_ai_usage FOR SELECT USING (true);
CREATE POLICY "Public Daily Usage Write Access" ON public.daily_ai_usage FOR ALL USING (true) WITH CHECK (true);

-- 8. Atomic Stored Procedures for Quota Increment and Rollback
CREATE OR REPLACE FUNCTION public.increment_daily_usage(
  p_user_id UUID,
  p_feature_type TEXT,
  p_usage_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.daily_ai_usage (user_id, feature_type, usage_date, prompt_count, updated_at)
  VALUES (p_user_id, p_feature_type, p_usage_date, 1, timezone('utc'::text, now()))
  ON CONFLICT (user_id, feature_type, usage_date)
  DO UPDATE SET
    prompt_count = public.daily_ai_usage.prompt_count + 1,
    updated_at = timezone('utc'::text, now())
  RETURNING prompt_count INTO v_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_daily_usage(
  p_user_id UUID,
  p_feature_type TEXT,
  p_usage_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.daily_ai_usage
  SET prompt_count = GREATEST(0, prompt_count - 1),
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND usage_date = p_usage_date
  RETURNING prompt_count INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_study_sets_created_at ON public.study_sets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sets_user_id ON public.study_sets (user_id);
CREATE INDEX IF NOT EXISTS idx_solved_exams_created_at ON public.solved_exams (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solved_exams_user_id ON public.solved_exams (user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_created_at ON public.tutor_conversations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_user_id ON public.tutor_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_feature_date ON public.daily_ai_usage (user_id, feature_type, usage_date);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);


