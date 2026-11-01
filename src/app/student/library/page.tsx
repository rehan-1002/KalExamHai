import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { AdminBar } from "@/components/navigation/admin-bar";
import { signOutAction } from "@/app/auth/actions";
import { DocumentsManager } from "@/components/features/documents/documents-manager";
import { isAdminEmail } from "@/lib/auth/admin";
import type { DocumentItem } from "@/components/features/documents/document-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Student Knowledge Library — KalExamHai",
};

async function StudentLibraryContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/student/library");
  }

  const isAdmin = isAdminEmail(user.email);
  const adminClient = getAdminClient();

  // Fetch user documents securely filtered by user id
  const { data: rawDocs } = await adminClient
    .from("documents")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const documents: DocumentItem[] = (rawDocs || []).map((d) => ({
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

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
          My Notes &amp; Syllabus Library
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Upload your lecture slides or college notes to generate personalized quick notes, 3D flashcards, and viva prep questions.
        </p>
      </div>

      <DocumentsManager initialDocuments={documents} />
    </div>
  );
}

export default function StudentLibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F6] flex items-center justify-center text-sm text-[#6B7280]">
          Loading student library...
        </div>
      }
    >
      <StudentLibraryContent />
    </Suspense>
  );
}

