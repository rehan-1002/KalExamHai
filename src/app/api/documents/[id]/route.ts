import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id: documentId } = await context.params;

    if (!documentId) {
      return NextResponse.json(
        { ok: false, message: "Document ID is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const adminClient = getAdminClient();

    // 1. Fetch document to retrieve storage path
    const { data: doc, error: fetchErr } = await adminClient
      .from("documents")
      .select("id, storage_path, owner_id")
      .eq("id", documentId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[DELETE /api/documents/[id]] Fetch error:", fetchErr);
    }

    // 2. Remove file from Supabase Storage if it exists
    if (doc?.storage_path) {
      try {
        await adminClient.storage.from("documents").remove([doc.storage_path]);
      } catch (storageErr) {
        console.warn("[DELETE /api/documents/[id]] Storage delete warning:", storageErr);
      }
    }

    // 3. Delete document row from documents table (cascades to document_chunks)
    const { error: delErr } = await adminClient
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("owner_id", user.id);

    if (delErr) {
      console.error("[DELETE /api/documents/[id]] DB delete error:", delErr);
      return NextResponse.json(
        { ok: false, message: `Failed to delete document: ${delErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: { deletedId: documentId } });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[DELETE /api/documents/[id]] Uncaught error:", errorMsg, err);
    return NextResponse.json(
      { ok: false, message: `Delete failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}

