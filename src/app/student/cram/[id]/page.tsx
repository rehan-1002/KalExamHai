import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { isAdminEmail } from "@/lib/auth/admin";
import { FlashcardDeck } from "@/components/features/cram/flashcard-deck";
import { QuickNotesView } from "@/components/features/cram/quick-notes-view";
import { VivaPrepView } from "@/components/features/cram/viva-prep-view";
import { SurvivalKitView } from "@/components/features/cram/survival-kit-view";
import { KtBusterView } from "@/components/features/cram/kt-buster-view";
import type {
  FlashcardsPayload,
  QuickNotesPayload,
  VivaPrepPayload,
  SurvivalKitPayload,
  KtBusterPayload,
} from "@/lib/schemas/cram";

export const dynamic = "force-dynamic";

interface CramDetailsPageProps {
  params: Promise<{ id: string }>;
}

async function CramDetailsContent({ params }: CramDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/student/cram/${id}`);
  }

  const adminClient = getAdminClient();
  const { data: record, error } = await adminClient
    .from("cram_artifacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !record) {
    notFound();
  }

  const isAdmin = isAdminEmail(user.email);
  if (record.owner_id !== user.id && !isAdmin) {
    notFound();
  }

  const effectiveType = (record.content as { type?: string })?.type || record.artifact_type;

  return (
    <div className="py-4 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {effectiveType === "flashcards" && (
        <FlashcardDeck payload={record.content as FlashcardsPayload} />
      )}
      {effectiveType === "quick_notes" && (
        <QuickNotesView payload={record.content as QuickNotesPayload} />
      )}
      {effectiveType === "viva_prep" && (
        <VivaPrepView payload={record.content as VivaPrepPayload} />
      )}
      {effectiveType === "survival_kit" && (
        <SurvivalKitView payload={record.content as SurvivalKitPayload} />
      )}
      {effectiveType === "kt_buster" && (
        <KtBusterView payload={record.content as KtBusterPayload} />
      )}
    </div>
  );
}

export default function CramDetailsPage(props: CramDetailsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          Loading study session...
        </div>
      }
    >
      <CramDetailsContent {...props} />
    </Suspense>
  );
}

