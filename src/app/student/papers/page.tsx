import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { PaperHistoryTable } from "@/components/features/papers/paper-history-table";
import { BackButton } from "@/components/navigation/back-button";
import type { PaperJson } from "@/lib/schemas/paper";

export const dynamic = "force-dynamic";

async function StudentPapersContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/student/papers");
  }

  const adminClient = getAdminClient();

  const { data: records } = await adminClient
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
            <BackButton fallbackUrl="/student" label="Cram Hub" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Practice Exam Papers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review, practice, and export Mumbai University NEP-2020 exam papers generated for your studies.
          </p>
        </div>
      </div>

      <PaperHistoryTable initialPapers={papers} />
    </div>
  );
}

export default function StudentPapersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          Loading practice papers...
        </div>
      }
    >
      <StudentPapersContent />
    </Suspense>
  );
}

