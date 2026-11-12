import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { getDailyQuotaStatus } from "@/server/credits/daily-quota";
import { CramWizard } from "@/components/features/cram/cram-wizard";
import type { CramArtifactType } from "@/lib/schemas/cram";

export const dynamic = "force-dynamic";

interface NewCramPageProps {
  searchParams: Promise<{ type?: string; docId?: string }>;
}

async function NewCramContent({ searchParams }: NewCramPageProps) {
  const { type, docId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/student/cram/new`);
  }

  const adminClient = getAdminClient();
  const { data: documents } = await adminClient
    .from("documents")
    .select("id, title, subject, status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const safeDocs = (documents || []).map((d) => ({
    id: d.id,
    title: d.title,
    subject: d.subject,
    status: d.status,
  }));

  const validTypes: CramArtifactType[] = [
    "kt_buster",
    "flashcards",
    "quick_notes",
    "viva_prep",
    "survival_kit",
  ];
  const initialType: CramArtifactType | undefined = validTypes.includes(
    type as CramArtifactType
  )
    ? (type as CramArtifactType)
    : undefined;

  const quota = await getDailyQuotaStatus(user.id);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <CramWizard
        documents={safeDocs}
        initialType={initialType}
        initialDocId={docId}
        quota={quota}
      />
    </div>
  );
}

export default function NewCramPage(props: NewCramPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          Loading cram generator...
        </div>
      }
    >
      <NewCramContent {...props} />
    </Suspense>
  );
}

