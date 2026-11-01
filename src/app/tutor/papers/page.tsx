import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { PaperHistoryTable } from "@/components/features/papers/paper-history-table";
import { BackButton } from "@/components/navigation/back-button";
import type { PaperJson } from "@/lib/schemas/paper";

async function PapersContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/tutor/papers");
  }

  const adminClient = getAdminClient();

  const { data: records, error } = await adminClient
    .from("generated_papers")
    .select("id, format, title, subject, course_code, created_at, credits_charged, paper")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const papers = (records || []).map((r) => {
    const paperJson = r.paper as PaperJson;
    return {
      id: r.id,
      format: r.format as "IAT" | "END_SEM",
      title: r.title,
      subject: r.subject || paperJson?.subject || "Subject",
      course_code: r.course_code || paperJson?.course_code,
      created_at: r.created_at,
      credits_charged: r.credits_charged,
      total_attemptable_marks: paperJson?.total_attemptable_marks || (r.format === "IAT" ? 20 : 60),
    };
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="mb-2">
            <BackButton fallbackUrl="/tutor" label="Previous Page" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generated Question Papers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review, customize, and export all NEP-2020 question papers generated for your courses.
          </p>
        </div>
      </div>

      <PaperHistoryTable initialPapers={papers} />
    </div>
  );
}

export default function TutorPapersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          Loading generated papers...
        </div>
      }
    >
      <PapersContent />
    </Suspense>
  );
}