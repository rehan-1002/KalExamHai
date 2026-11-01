-- ==============================================================================
-- KalExamHai: Phase 4 Schema — Generated Papers (NEP-2020 Engine)
-- Tables: generated_papers
-- Security: Strict Row Level Security (RLS)
-- ==============================================================================

-- 1. Create paper format enum if not exists
DO $$ BEGIN
  CREATE TYPE paper_format AS ENUM ('IAT', 'END_SEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create Generated Papers table
CREATE TABLE IF NOT EXISTS public.generated_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  format paper_format NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  course_code TEXT,
  document_ids UUID[] NOT NULL,
  params JSONB NOT NULL DEFAULT '{}',
  paper JSONB NOT NULL,            -- Validated PaperJson
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  validation_attempts INTEGER NOT NULL DEFAULT 1,
  credits_charged INTEGER NOT NULL,
  request_id UUID NOT NULL UNIQUE, -- Idempotency key
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index on owner and created_at
CREATE INDEX IF NOT EXISTS idx_generated_papers_owner ON public.generated_papers(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_papers_format ON public.generated_papers(format);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.generated_papers ENABLE ROW LEVEL SECURITY;

-- Generated Papers Policies
DROP POLICY IF EXISTS "Users can view their own generated papers" ON public.generated_papers;
CREATE POLICY "Users can view their own generated papers"
  ON public.generated_papers
  FOR SELECT
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Users can update their own generated papers" ON public.generated_papers;
CREATE POLICY "Users can update their own generated papers"
  ON public.generated_papers
  FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Users can delete their own generated papers" ON public.generated_papers;
CREATE POLICY "Users can delete their own generated papers"
  ON public.generated_papers
  FOR DELETE
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Service role manages generated papers" ON public.generated_papers;
CREATE POLICY "Service role manages generated papers"
  ON public.generated_papers
  FOR ALL
  USING (auth.role() = 'service_role');

