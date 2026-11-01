import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runIngestionPipeline } from "@/server/ingestion/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: documentId } = await context.params;

    if (!documentId) {
      return NextResponse.json(
        { ok: false, code: "MISSING_ID", message: "Document ID is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "You must be signed in." },
        { status: 401 }
      );
    }

    // Read optional pre-extracted text from the request body
    let clientExtractedText = "";
    let clientPageCount = 0;
    try {
      const body = await request.json();
      clientExtractedText = (body.extractedText as string | undefined)?.trim() || "";
      clientPageCount = parseInt(String(body.pageCount || "0"), 10);
    } catch {
      // Body may be empty — that's fine, we'll use storage fallback
    }

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
        status: "ready",
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/documents/process/[id]] Error:", errorMsg, err);
    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_SERVER_ERROR",
        message: `Processing Error: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}

// GET to poll document status
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: documentId } = await context.params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "You must be signed in." },
        { status: 401 }
      );
    }

    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, status, error_message, page_count, title")
      .eq("id", documentId)
      .eq("owner_id", user.id)
      .single();

    if (error || !doc) {
      return NextResponse.json(
        { ok: false, code: "NOT_FOUND", message: "Document not found." },
        { status: 404 }
      );
    }

    // Count chunks if ready
    let chunkCount: number | undefined;
    if (doc.status === "ready") {
      const { count } = await supabase
        .from("document_chunks")
        .select("id", { count: "exact", head: true })
        .eq("document_id", documentId);
      chunkCount = count ?? undefined;
    }

    return NextResponse.json({
      ok: true,
      data: {
        documentId,
        status: doc.status,
        pageCount: doc.page_count,
        chunkCount,
        errorMessage: doc.error_message,
        title: doc.title,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_SERVER_ERROR", message: errorMsg },
      { status: 500 }
    );
  }
}

