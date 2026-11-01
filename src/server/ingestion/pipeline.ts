import "server-only";
import { getAdminClient } from "../supabase/admin";
import { extractDocumentText, type ExtractedDocument } from "./extract-text";
import { chunkDocument } from "./chunker";
import { generateEmbeddings } from "../gemini/embed";

export interface IngestionResult {
  ok: boolean;
  documentId: string;
  chunkCount?: number;
  pageCount?: number;
  error?: string;
}

/**
 * Executes the complete ingestion pipeline for an uploaded document or pasted text:
 * 1. Status -> 'extracting'
 * 2. Text extraction (with PDF per-page breakdown & OCR fallback)
 * 3. Token-bounded semantic chunking with Mumbai University unit attribution
 * 4. Status -> 'embedding'
 * 5. Gemini text-embedding-004 batch vector generation (768 dimensions)
 * 6. Store vectors in pgvector `document_chunks`
 * 7. Status -> 'ready' (or 'failed' on error)
 */
export async function runIngestionPipeline(
  documentId: string,
  ownerId: string,
  preExtractedText?: string,
  preExtractedPageCount?: number,
  directBuffer?: Buffer
): Promise<IngestionResult> {
  const supabase = getAdminClient();

  // 1. Fetch document record
  const { data: doc, error: fetchErr } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("owner_id", ownerId)
    .single();

  if (fetchErr || !doc) {
    return {
      ok: false,
      documentId,
      error: `Document not found or inaccessible: ${fetchErr?.message || "Unknown error"}`,
    };
  }

  try {
    // 2. Mark status as 'extracting'
    await supabase
      .from("documents")
      .update({ status: "extracting", error_message: null })
      .eq("id", documentId);

    let extracted: ExtractedDocument;

    // Fast-path: Client-side already extracted text, eliminating serverless parsing bottlenecks
    if (preExtractedText && preExtractedText.trim().length > 20) {
      const pageCount =
        preExtractedPageCount && preExtractedPageCount > 0
          ? preExtractedPageCount
          : Math.max(1, Math.ceil(preExtractedText.length / 2500));

      const rawPages = preExtractedText.split(/\[Page \d+\]\n/).filter(Boolean);
      const pages =
        rawPages.length > 0
          ? rawPages.map((pText, i) => ({ pageNumber: i + 1, text: pText.trim() }))
          : [{ pageNumber: 1, text: preExtractedText.trim() }];

      extracted = {
        text: preExtractedText.trim(),
        pages,
        pageCount,
        extractionQuality: 1.0,
      };
    } else {
      let fileBuffer: Buffer;

      if (directBuffer && directBuffer.length > 0) {
        // Instant in-memory buffer: zero network download delay!
        fileBuffer = directBuffer;
      } else if (doc.storage_path) {
        // Download file from private Supabase Storage bucket 'documents'
        const { data: fileData, error: downloadErr } = await supabase.storage
          .from("documents")
          .download(doc.storage_path);

        if (downloadErr || !fileData) {
          throw new Error(`Failed to download document from storage: ${downloadErr?.message}`);
        }

        fileBuffer = Buffer.from(await fileData.arrayBuffer());
      } else {
        throw new Error("No storage path provided for document extraction.");
      }

      // 3. Extract text
      extracted = await extractDocumentText(
        fileBuffer,
        doc.mime_type || "application/pdf",
        doc.title
      );
    }

    if (!extracted.text.trim()) {
      throw new Error("No readable text could be extracted from this document.");
    }

    // Update document metadata with page count and extraction quality
    await supabase
      .from("documents")
      .update({
        page_count: extracted.pageCount,
        extraction_quality: extracted.extractionQuality,
      })
      .eq("id", documentId);

    // 4. Chunk document
    const chunks = chunkDocument(extracted);

    if (chunks.length === 0) {
      throw new Error("Document text produced zero valid semantic chunks.");
    }

    // 5. Mark status as 'embedding'
    await supabase
      .from("documents")
      .update({ status: "embedding" })
      .eq("id", documentId);

    // 6. Generate 768-dim embeddings via Gemini text-embedding-004
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkTexts);

    if (embeddings.length !== chunks.length) {
      throw new Error(
        `Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`
      );
    }

    // Delete any previous chunks for this document in case of retry
    await supabase.from("document_chunks").delete().eq("document_id", documentId);

    // 7. Insert chunk rows into document_chunks
    const chunkRows = chunks.map((chunk, idx) => ({
      document_id: documentId,
      owner_id: ownerId,
      chunk_index: chunk.chunkIndex,
      unit_label: chunk.unitLabel,
      page_start: chunk.pageStart,
      page_end: chunk.pageEnd,
      content: chunk.content,
      token_count: chunk.tokenCount,
      embedding: embeddings[idx],
    }));

    const { error: insertErr } = await supabase.from("document_chunks").insert(chunkRows);

    if (insertErr) {
      throw new Error(`Failed to save document chunks: ${insertErr.message}`);
    }

    // 8. Mark status as 'ready'
    await supabase
      .from("documents")
      .update({
        status: "ready",
        error_message: null,
      })
      .eq("id", documentId);

    return {
      ok: true,
      documentId,
      chunkCount: chunks.length,
      pageCount: extracted.pageCount,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[IngestionPipeline] Document ${documentId} failed:`, errorMsg);

    // Mark status as 'failed' with error reason
    await supabase
      .from("documents")
      .update({
        status: "failed",
        error_message: errorMsg,
      })
      .eq("id", documentId);

    return {
      ok: false,
      documentId,
      error: errorMsg,
    };
  }
}

/**
 * Handles direct text / syllabus paste ingestion without file storage upload.
 */
export async function runPastedTextIngestion(
  title: string,
  content: string,
  ownerId: string,
  subject?: string
): Promise<IngestionResult> {
  const supabase = getAdminClient();

  // Create document entry
  const { data: doc, error: createErr } = await supabase
    .from("documents")
    .insert({
      owner_id: ownerId,
      title,
      subject: subject || null,
      storage_path: null,
      mime_type: "text/plain",
      size_bytes: Buffer.byteLength(content, "utf-8"),
      page_count: Math.max(1, Math.ceil(content.length / 2500)),
      status: "extracting",
    })
    .select("id")
    .single();

  if (createErr || !doc) {
    return {
      ok: false,
      documentId: "",
      error: `Failed to create document record: ${createErr?.message}`,
    };
  }

  const documentId = doc.id;

  try {
    const buffer = Buffer.from(content, "utf-8");
    const extracted = await extractDocumentText(buffer, "text/plain", title);
    const chunks = chunkDocument(extracted);

    if (chunks.length === 0) {
      throw new Error("Pasted content produced zero chunks.");
    }

    await supabase
      .from("documents")
      .update({ status: "embedding", page_count: extracted.pageCount })
      .eq("id", documentId);

    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkTexts);

    const chunkRows = chunks.map((chunk, idx) => ({
      document_id: documentId,
      owner_id: ownerId,
      chunk_index: chunk.chunkIndex,
      unit_label: chunk.unitLabel,
      page_start: chunk.pageStart,
      page_end: chunk.pageEnd,
      content: chunk.content,
      token_count: chunk.tokenCount,
      embedding: embeddings[idx],
    }));

    const { error: insertErr } = await supabase.from("document_chunks").insert(chunkRows);
    if (insertErr) {
      throw new Error(`Failed to save chunks: ${insertErr.message}`);
    }

    await supabase
      .from("documents")
      .update({ status: "ready", error_message: null })
      .eq("id", documentId);

    return {
      ok: true,
      documentId,
      chunkCount: chunks.length,
      pageCount: extracted.pageCount,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("documents")
      .update({ status: "failed", error_message: errorMsg })
      .eq("id", documentId);

    return {
      ok: false,
      documentId,
      error: errorMsg,
    };
  }
}

