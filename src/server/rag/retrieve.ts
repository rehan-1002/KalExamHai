import "server-only";
import { getAdminClient } from "../supabase/admin";
import { generateQueryEmbedding } from "../gemini/embed";
import type { RetrievedChunk } from "./context-builder";

export interface RetrievalParams {
  documentIds: string[];
  ownerId: string;
  query?: string;
  unitLabels?: string[];
  matchCount?: number;
  matchThreshold?: number;
}

/**
 * Retrieves semantic chunks for a given user and set of documents.
 * Employs pgvector cosine similarity matching and unit balancing.
 */
export async function retrieveChunks({
  documentIds,
  ownerId,
  query,
  unitLabels,
  matchCount = 16,
  matchThreshold = 0.2,
}: RetrievalParams): Promise<RetrievedChunk[]> {
  const supabase = getAdminClient();

  if (documentIds.length === 0) {
    return [];
  }

  // Fetch document titles for citation display
  const { data: docs } = await supabase
    .from("documents")
    .select("id, title")
    .in("id", documentIds);

  const titleMap = new Map<string, string>();
  docs?.forEach((d) => titleMap.set(d.id, d.title));

  if (query && query.trim()) {
    // 1. Semantic query retrieval using pgvector cosine ops
    const queryVector = await generateQueryEmbedding(query);

    const { data: rpcChunks, error: rpcErr } = await supabase.rpc("match_chunks", {
      p_query_embedding: queryVector,
      p_match_threshold: matchThreshold,
      p_match_count: matchCount,
      p_document_ids: documentIds,
      p_owner_id: ownerId,
    });

    if (rpcErr) {
      console.error("[retrieveChunks] match_chunks RPC failed:", rpcErr);
      throw new Error(`Vector retrieval failed: ${rpcErr.message}`);
    }

    if (!rpcChunks || rpcChunks.length === 0) {
      return [];
    }

    return rpcChunks.map((c: {
      id: string;
      document_id: string;
      chunk_index: number;
      unit_label: string;
      page_start: number;
      page_end: number;
      content: string;
      token_count: number;
      similarity: number;
    }) => ({
      id: c.id,
      documentId: c.document_id,
      documentTitle: titleMap.get(c.document_id) || "Document",
      chunkIndex: c.chunk_index,
      unitLabel: c.unit_label || "General",
      pageStart: c.page_start || 1,
      pageEnd: c.page_end || 1,
      content: c.content,
      tokenCount: c.token_count,
      similarity: c.similarity,
    }));
  }

  // 2. Syllabus / Unit balanced retrieval (for full exam paper generation)
  let queryBuilder = supabase
    .from("document_chunks")
    .select("id, document_id, chunk_index, unit_label, page_start, page_end, content, token_count")
    .in("document_id", documentIds)
    .eq("owner_id", ownerId)
    .order("chunk_index", { ascending: true })
    .limit(matchCount);

  if (unitLabels && unitLabels.length > 0) {
    queryBuilder = queryBuilder.in("unit_label", unitLabels);
  }

  const { data: chunks, error } = await queryBuilder;

  if (error || !chunks) {
    console.error("[retrieveChunks] Syllabus retrieval failed:", error);
    return [];
  }

  return chunks.map((c) => ({
    id: c.id,
    documentId: c.document_id,
    documentTitle: titleMap.get(c.document_id) || "Document",
    chunkIndex: c.chunk_index,
    unitLabel: c.unit_label || "General",
    pageStart: c.page_start || 1,
    pageEnd: c.page_end || 1,
    content: c.content,
    tokenCount: c.token_count,
  }));
}

