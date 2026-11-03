import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDailyQuotaStatus } from "@/server/credits/daily-quota";
import { BackButton } from "@/components/navigation/back-button";
import { GenerateWizard } from "@/components/features/papers/generate-wizard";
import type { PaperFormat } from "@/lib/schemas/paper";

export const dynamic = "force-dynamic";

interface StudentGenerateContentProps {
  searchParams: Promise<{ format?: string }>;
}

async function StudentGenerateContent({ searchParams }: StudentGenerateContentProps) {
  const { format: rawFormat } = await searchParams;
  const initialFormat: PaperFormat | undefined =
    rawFormat === "END_SEM" ? "END_SEM" : rawFormat === "IAT" ? "IAT" : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/student/papers/generate");
  }

  const isAdmin = isAdminEmail(user.email);
  const adminClient = getAdminClient();

  // Fetch user credit balance from credit ledger
  const { data: ledgerEntry } = await adminClient
    .from("credit_ledger")
    .select("balance_after")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const creditBalance = ledgerEntry?.balance_after ?? (isAdmin ? 9999 : 2);
  const quota = await getDailyQuotaStatus(user.id);

  // Fetch user's ingested documents
  const { data: documents } = await adminClient
    .from("documents")
    .select("id, title, subject, page_count, status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const safeDocuments = (documents || []).map((doc) => ({
    id: doc.id,
    title: doc.title,
    subject: doc.subject,
    page_count: doc.page_count,
    status: doc.status,
  }));

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="mb-2">
            <BackButton fallbackUrl="/student/papers" label="Practice Papers" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Practice Paper Generator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Select course syllabus notes to generate strict Mumbai University NEP-2020 practice papers (IAT 20M or End-Sem 60M).
          </p>
        </div>
      </div>

      <GenerateWizard
        documents={safeDocuments}
        creditBalance={creditBalance}
        initialFormat={initialFormat}
        quota={quota}
      />
    </div>
  );
}

export default function StudentGeneratePage(props: StudentGenerateContentProps) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          Loading practice paper generator...
        </div>
      }
    >
      <StudentGenerateContent {...props} />
    </Suspense>
  );
}

