-- ==============================================================================
-- KalExamHai: Phase 5 Schema — Student Cramming Suite
-- Tables: cram_artifacts
-- Features: 3D Holo Flashcards, Quick Notes, Viva Prep, 24h Survival Kit
-- Security: Strict Row Level Security (RLS)
-- ==============================================================================

-- 1. Create cram artifact type enum if not exists
DO $$ BEGIN
  CREATE TYPE cram_artifact_type AS ENUM ('flashcards', 'quick_notes', 'viva_prep', 'survival_kit');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create Cram Artifacts table
CREATE TABLE IF NOT EXISTS public.cram_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_ids UUID[] NOT NULL,
  artifact_type cram_artifact_type NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  content JSONB NOT NULL,         -- Validated artifact payload
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index on owner and artifact_type
CREATE INDEX IF NOT EXISTS idx_cram_artifacts_owner ON public.cram_artifacts(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cram_artifacts_type ON public.cram_artifacts(artifact_type);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.cram_artifacts ENABLE ROW LEVEL SECURITY;

-- Cram Artifacts Policies
DROP POLICY IF EXISTS "Users can view their own cram artifacts" ON public.cram_artifacts;
CREATE POLICY "Users can view their own cram artifacts"
  ON public.cram_artifacts
  FOR SELECT
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Users can insert their own cram artifacts" ON public.cram_artifacts;
CREATE POLICY "Users can insert their own cram artifacts"
  ON public.cram_artifacts
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Users can update their own cram artifacts" ON public.cram_artifacts;
CREATE POLICY "Users can update their own cram artifacts"
  ON public.cram_artifacts
  FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Users can delete their own cram artifacts" ON public.cram_artifacts;
CREATE POLICY "Users can delete their own cram artifacts"
  ON public.cram_artifacts
  FOR DELETE
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Service role manages cram artifacts" ON public.cram_artifacts;
CREATE POLICY "Service role manages cram artifacts"
  ON public.cram_artifacts
  FOR ALL
  USING (auth.role() = 'service_role');

