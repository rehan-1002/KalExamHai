import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { PaperPrint } from "@/components/features/papers/paper-print";

export const dynamic = "force-dynamic";

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PrintPageProps): Promise<Metadata> {
  const { id } = await params;
  const adminClient = getAdminClient();
  const { data: paperRecord } = await adminClient
    .from("generated_papers")
    .select("title, subject, course_code, format, paper")
    .eq("id", id)
    .maybeSingle();

  if (!paperRecord) {
    return { title: "Question Paper Print — KalExamHai" };
  }

  const paperObj = paperRecord.paper as { exam_title?: string; subject?: string } | null;

  // Use the exact document name input before making the paper
  const docName =
    paperRecord.title ||
    paperObj?.exam_title ||
    paperRecord.subject ||
    paperObj?.subject ||
    "Question Paper";

  const courseSuffix = paperRecord.course_code ? ` (${paperRecord.course_code})` : "";

  return {
    title: `${docName}${courseSuffix}`,
  };
}

async function PrintPaperContent({ params }: PrintPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/tutor/papers/${id}/print`);
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

  return <PaperPrint paperRecord={paperRecord} />;
}

export default function PrintPaperPage(props: PrintPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-sm text-slate-500">
          Preparing A4 printable sheet...
        </div>
      }
    >
      <PrintPaperContent {...props} />
    </Suspense>
  );
}
