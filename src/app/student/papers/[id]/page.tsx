import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { PaperView } from "@/components/features/papers/paper-view";

export const dynamic = "force-dynamic";

interface StudentPaperDetailsPageProps {
  params: Promise<{ id: string }>;
}

async function StudentPaperDetailsContent({ params }: StudentPaperDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/student/papers/${id}`);
  }

  const adminClient = getAdminClient();
  const { data: paperRecord, error } = await adminClient
    .from("generated_papers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !paperRecord) {
    notFound();
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (paperRecord.owner_id !== user.id && profile?.role !== "admin") {
    notFound();
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <PaperView paperRecord={paperRecord} />
    </div>
  );
}

export default function StudentPaperDetailsPage(props: StudentPaperDetailsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          Loading practice paper...
        </div>
      }
    >
      <StudentPaperDetailsContent {...props} />
    </Suspense>
  );
}
