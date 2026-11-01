"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { runIngestionPipeline, runPastedTextIngestion } from "@/server/ingestion/pipeline";
import type { DocumentItem } from "@/components/features/documents/document-table";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/octet-stream", // Fallback for some markdown uploads
]);

/**
 * Server Action: Upload file to Supabase Storage and trigger the RAG ingestion pipeline.
 */
export async function uploadAndIngestDocumentAction(
  formData: FormData
): Promise<ActionResult<{ documentId: string; chunkCount?: number; pageCount?: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, code: "UNAUTHORIZED", message: "You must be signed in to upload documents." };
    }

    const file = formData.get("file") as File | null;
    const subject = (formData.get("subject") as string | null)?.trim() || "";
    const customTitle = (formData.get("title") as string | null)?.trim() || "";

    if (!file || file.size === 0) {
      return { ok: false, code: "INVALID_FILE", message: "Please select a valid document file." };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        ok: false,
        code: "FILE_TOO_LARGE",
        message: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 25 MB limit.`,
      };
    }

    const title = customTitle || file.name.replace(/\.[^/.]+$/, "");
    const mimeType = file.type || "application/pdf";
    const documentId = crypto.randomUUID();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${documentId}/${sanitizedFilename}`;

    const adminClient = getAdminClient();

    // 1. Ensure private 'documents' storage bucket exists (auto-healing)
    try {
      const { data: buckets } = await adminClient.storage.listBuckets();
      if (!buckets?.some((b) => b.name === "documents")) {
        await adminClient.storage.createBucket("documents", {
          public: false,
          fileSizeLimit: MAX_FILE_SIZE_BYTES,
          allowedMimeTypes: ["application/pdf", "text/plain", "text/markdown"],
        });
      }
    } catch (bucketErr) {
      console.warn("Storage bucket verification warning:", bucketErr);
    }

    // 2. Upload file buffer to private Storage bucket 'documents'
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);

    const { error: uploadErr } = await adminClient.storage
      .from("documents")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      return {
        ok: false,
        code: "STORAGE_ERROR",
        message: `Failed to store document: ${uploadErr.message}`,
      };
    }

    // 2. Insert record in `documents` table
    const { error: insertErr } = await adminClient.from("documents").insert({
      id: documentId,
      owner_id: user.id,
      title,
      subject: subject || null,
      storage_path: storagePath,
      mime_type: mimeType,
      size_bytes: file.size,
      status: "uploaded",
    });

    if (insertErr) {
      // Cleanup orphaned storage object
      await adminClient.storage.from("documents").remove([storagePath]);
      return {
        ok: false,
        code: "DB_ERROR",
        message: `Database error creating document: ${insertErr.message}`,
      };
    }

    // 3. Run the ingestion pipeline (extract -> chunk -> embed -> ready)
    const pipelineResult = await runIngestionPipeline(documentId, user.id);

    if (!pipelineResult.ok) {
      return {
        ok: false,
        code: "INGESTION_FAILED",
        message: pipelineResult.error || "Document processing failed.",
      };
    }

    revalidatePath("/tutor/documents");
    revalidatePath("/student/library");
    revalidatePath("/tutor/generate");

    return {
      ok: true,
      data: {
        documentId,
        chunkCount: pipelineResult.chunkCount,
        pageCount: pipelineResult.pageCount,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[uploadAndIngestDocumentAction] Uncaught error:", errorMsg);
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: `Server Error: ${errorMsg}`,
    };
  }
}

/**
 * Server Action: Paste syllabus / notes text directly and run ingestion.
 */
export async function pasteAndIngestDocumentAction(
  title: string,
  content: string,
  subject?: string
): Promise<ActionResult<{ documentId: string; chunkCount?: number; pageCount?: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, code: "UNAUTHORIZED", message: "You must be signed in to paste notes." };
    }

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle) {
      return { ok: false, code: "INVALID_TITLE", message: "Please enter a title for these notes." };
    }

    if (cleanContent.length < 50) {
      return {
        ok: false,
        code: "CONTENT_TOO_SHORT",
        message: "Please provide at least 50 characters of lecture or syllabus text.",
      };
    }

    const result = await runPastedTextIngestion(cleanTitle, cleanContent, user.id, subject);

    if (!result.ok) {
      return {
        ok: false,
        code: "INGESTION_FAILED",
        message: result.error || "Failed to process pasted content.",
      };
    }

    revalidatePath("/tutor/documents");
    revalidatePath("/student/library");
    revalidatePath("/tutor/generate");

    return {
      ok: true,
      data: {
        documentId: result.documentId,
        chunkCount: result.chunkCount,
        pageCount: result.pageCount,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[pasteAndIngestDocumentAction] Uncaught error:", errorMsg);
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: `Server Error: ${errorMsg}`,
    };
  }
}

/**
 * Server Action: Delete a document and its storage object and chunks.
 */
export async function deleteDocumentAction(
  documentId: string
): Promise<ActionResult<{ success: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: "UNAUTHORIZED", message: "Unauthorized." };
  }

  const adminClient = getAdminClient();

  // Find document to get storage path
  const { data: doc } = await adminClient
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("owner_id", user.id)
    .single();

  if (doc?.storage_path) {
    await adminClient.storage.from("documents").remove([doc.storage_path]);
  }

  const { error: delErr } = await adminClient
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("owner_id", user.id);

  if (delErr) {
    return { ok: false, code: "DELETE_FAILED", message: delErr.message };
  }

  revalidatePath("/tutor/documents");
  revalidatePath("/student/library");
  revalidatePath("/tutor/generate");

  return { ok: true, data: { success: true } };
}

/**
 * Server Action: Retry ingestion for a failed document.
 */
export async function retryIngestionAction(
  documentId: string
): Promise<ActionResult<{ success: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: "UNAUTHORIZED", message: "Unauthorized." };
  }

  const result = await runIngestionPipeline(documentId, user.id);
  if (!result.ok) {
    return {
      ok: false,
      code: "RETRY_FAILED",
      message: result.error || "Retry processing failed.",
    };
  }

  revalidatePath("/tutor/documents");
  revalidatePath("/student/library");
  revalidatePath("/tutor/generate");

  return { ok: true, data: { success: true } };
}

/**
 * Server Action: Retrieve all documents belonging to the authenticated user.
 */
export async function getUserDocumentsAction(): Promise<DocumentItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const adminClient = getAdminClient();
  const { data: rawDocs, error } = await adminClient
    .from("documents")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !rawDocs) return [];

  return rawDocs.map((d) => ({
    id: d.id,
    title: d.title,
    subject: d.subject,
    mime_type: d.mime_type,
    size_bytes: d.size_bytes,
    page_count: d.page_count,
    status: d.status,
    error_message: d.error_message,
    created_at: d.created_at,
  }));
}

