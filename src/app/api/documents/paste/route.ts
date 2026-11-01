import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPastedTextIngestion } from "@/server/ingestion/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "You must be signed in to paste notes." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const title = (body.title as string | undefined)?.trim();
    const content = (body.content as string | undefined)?.trim();
    const subject = (body.subject as string | undefined)?.trim();

    if (!title) {
      return NextResponse.json(
        { ok: false, code: "INVALID_TITLE", message: "Please enter a title for these notes." },
        { status: 400 }
      );
    }

    if (!content || content.length < 50) {
      return NextResponse.json(
        {
          ok: false,
          code: "CONTENT_TOO_SHORT",
          message: "Please provide at least 50 characters of lecture or syllabus text.",
        },
        { status: 400 }
      );
    }

    const result = await runPastedTextIngestion(title, content, user.id, subject);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: "INGESTION_FAILED",
          message: result.error || "Failed to process pasted content.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        documentId: result.documentId,
        chunkCount: result.chunkCount,
        pageCount: result.pageCount,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/documents/paste] Error:", errorMsg, err);
    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_SERVER_ERROR",
        message: `Paste Ingestion Error: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}


