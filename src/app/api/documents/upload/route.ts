import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { runIngestionPipeline } from "@/server/ingestion/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds on Vercel Serverless

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "You must be signed in to upload documents." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subject = (formData.get("subject") as string | null)?.trim() || "";
    const customTitle = (formData.get("title") as string | null)?.trim() || "";
    const clientExtractedText = (formData.get("extractedText") as string | null)?.trim() || "";
    const clientPageCount = parseInt((formData.get("pageCount") as string | null) || "0", 10);

    if (!file || file.size === 0) {
      return NextResponse.json(
        { ok: false, code: "INVALID_FILE", message: "Please select a valid document file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          code: "FILE_TOO_LARGE",
          message: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 25 MB limit.`,
        },
        { status: 400 }
      );
    }

    const title = customTitle || file.name.replace(/\.[^/.]+$/, "");
    const mimeType = file.type || "application/pdf";
    const documentId = crypto.randomUUID();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${documentId}/${sanitizedFilename}`;

    const adminClient = getAdminClient();

    // 1. Ensure private 'documents' storage bucket exists
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
      console.warn("Storage bucket check warning:", bucketErr);
    }

    // 2. Upload file buffer to Supabase Storage
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);

    const { error: uploadErr } = await adminClient.storage
      .from("documents")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      return NextResponse.json(
        {
          ok: false,
          code: "STORAGE_ERROR",
          message: `Failed to store document in Supabase Storage: ${uploadErr.message}`,
        },
        { status: 500 }
      );
    }

    // 3. Insert record in `documents` table
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
      await adminClient.storage.from("documents").remove([storagePath]);
      return NextResponse.json(
        {
          ok: false,
          code: "DB_ERROR",
          message: `Database error inserting document: ${insertErr.message}`,
        },
        { status: 500 }
      );
    }

    // 4. Run the ingestion pipeline (extract -> chunk -> embed -> ready)
    const pipelineResult = await runIngestionPipeline(
      documentId,
      user.id,
      clientExtractedText || undefined,
      clientPageCount || undefined
    );

    if (!pipelineResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: "INGESTION_FAILED",
          message: pipelineResult.error || "Document processing failed.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        documentId,
        chunkCount: pipelineResult.chunkCount,
        pageCount: pipelineResult.pageCount,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/documents/upload] Error:", errorMsg, err);
    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_SERVER_ERROR",
        message: `Upload Error: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}

