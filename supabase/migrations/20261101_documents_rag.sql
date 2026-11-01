-- ==============================================================================
-- KalExamHai: Phase 3 Schema — Documents, Chunks, HNSW pgvector RAG Pipeline
-- Tables: documents, document_chunks
-- Extensions: vector (pgvector), pgcrypto
-- Stored Procedures: match_chunks (cosine similarity RAG query)
-- Storage: private 'documents' bucket with strict folder ownership RLS
-- ==============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create document processing status enum
DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM ('uploaded', 'extracting', 'embedding', 'ready', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  course_code TEXT,
  storage_path TEXT,              -- null for pasted text notes
  mime_type TEXT,
  size_bytes BIGINT DEFAULT 0,
  page_count INTEGER DEFAULT 1,
  status doc_status NOT NULL DEFAULT 'uploaded',
  error_message TEXT,
  extraction_quality NUMERIC(3,2) DEFAULT 1.00, -- 0.00 to 1.00 heuristic
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for document lookups
CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

-- 4. Create Document Chunks table for RAG embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  unit_label TEXT,               -- e.g. "Module 1", "Unit 2", "Chapter 3"
  page_start INTEGER,
  page_end INTEGER,
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  embedding vector(768) NOT NULL, -- 768 dimensions for Gemini text-embedding-004
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Chunk indexing
CREATE INDEX IF NOT EXISTS idx_chunks_document ON public.document_chunks(document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_owner ON public.document_chunks(owner_id);

-- High-performance HNSW index for cosine ops
CREATE INDEX IF NOT EXISTS idx_chunks_embedding 
  ON public.document_chunks 
  USING hnsw (embedding vector_cosine_ops);

-- 5. Stored Procedure for Semantic Vector Retrieval (match_chunks)
CREATE OR REPLACE FUNCTION public.match_chunks(
  p_query_embedding vector(768),
  p_match_threshold FLOAT DEFAULT 0.2,
  p_match_count INTEGER DEFAULT 8,
  p_document_ids UUID[] DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_index INTEGER,
  unit_label TEXT,
  page_start INTEGER,
  page_end INTEGER,
  content TEXT,
  token_count INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.unit_label,
    dc.page_start,
    dc.page_end,
    dc.content,
    dc.token_count,
    (1 - (dc.embedding <=> p_query_embedding))::FLOAT AS similarity
  FROM public.document_chunks dc
  WHERE
    (p_owner_id IS NULL OR dc.owner_id = p_owner_id)
    AND (p_document_ids IS NULL OR dc.document_id = ANY(p_document_ids))
    AND (1 - (dc.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY dc.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Documents RLS Policies
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view their own documents"
  ON public.documents
  FOR SELECT
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "Users can insert their own documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents"
  ON public.documents
  FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "Users can delete their own documents"
  ON public.documents
  FOR DELETE
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Document Chunks RLS Policies
DROP POLICY IF EXISTS "Users can view their own document chunks" ON public.document_chunks;
CREATE POLICY "Users can view their own document chunks"
  ON public.document_chunks
  FOR SELECT
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Service role manages document chunks" ON public.document_chunks;
CREATE POLICY "Service role manages document chunks"
  ON public.document_chunks
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7. Configure Private Storage Bucket for Documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  26214400, -- 25MB
  ARRAY['application/pdf', 'text/plain', 'text/markdown']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['application/pdf', 'text/plain', 'text/markdown'];

-- Storage Policies for folder-isolated uploads: {user_id}/{document_id}/{filename}
DROP POLICY IF EXISTS "Users can upload their own documents to storage" ON storage.objects;
CREATE POLICY "Users can upload their own documents to storage"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view their own documents from storage" ON storage.objects;
CREATE POLICY "Users can view their own documents from storage"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' AND
    ((storage.foldername(name))[1] = auth.uid()::text OR
     (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

DROP POLICY IF EXISTS "Users can delete their own documents from storage" ON storage.objects;
CREATE POLICY "Users can delete their own documents from storage"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents' AND
    ((storage.foldername(name))[1] = auth.uid()::text OR
     (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

