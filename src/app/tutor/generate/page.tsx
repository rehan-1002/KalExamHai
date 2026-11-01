import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDailyQuotaStatus } from "@/server/credits/daily-quota";
import { BackButton } from "@/components/navigation/back-button";
import { GenerateWizard } from "@/components/features/papers/generate-wizard";
import type { PaperFormat } from "@/lib/schemas/paper";

interface GenerateContentProps {
  searchParams: Promise<{ format?: string }>;
}

async function GenerateContent({ searchParams }: GenerateContentProps) {
  const { format: rawFormat } = await searchParams;
  const initialFormat: PaperFormat | undefined =
    rawFormat === "END_SEM" ? "END_SEM" : rawFormat === "IAT" ? "IAT" : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/tutor/generate");
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
            <BackButton fallbackUrl="/tutor" label="Previous Page" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Paper Generator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Select course syllabus documents and generate university-standard IAT or End-Sem examination papers with KaTeX equations and NEP-2020 compliance.
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

export default function TutorGeneratePage(props: GenerateContentProps) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          Loading generator workspace...
        </div>
      }
    >
      <GenerateContent {...props} />
    </Suspense>
  );
}