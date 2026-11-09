-- ==============================================================================
-- KalExamHai Migration: Add 'kt_buster' to cram_artifact_type enum
-- Features: KT Buster (24-Mark Minimum Passing Strategy)
-- ==============================================================================

DO $$ BEGIN
  ALTER TYPE cram_artifact_type ADD VALUE IF NOT EXISTS 'kt_buster';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

