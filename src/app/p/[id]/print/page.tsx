import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminClient } from "@/server/supabase/admin";
import { PaperPrint } from "@/components/features/papers/paper-print";
import type { PaperJson } from "@/lib/schemas/paper";

export const dynamic = "force-dynamic";

interface PublicPrintPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PublicPrintPageProps): Promise<Metadata> {
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
  const docName =
    paperRecord.title ||
    paperObj?.exam_title ||
    paperRecord.subject ||
    paperObj?.subject ||
    "Question Paper";

  const courseSuffix = paperRecord.course_code ? ` (${paperRecord.course_code})` : "";
  return {
    title: `${docName}${courseSuffix} | MU NEP-2020 Print`,
  };
}

export default async function PublicPrintPage({ params }: PublicPrintPageProps) {
  const { id } = await params;
  const adminClient = getAdminClient();

  const { data: paperRecord } = await adminClient
    .from("generated_papers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!paperRecord || !paperRecord.paper) {
    notFound();
  }

  const safeRecord = {
    id: paperRecord.id,
    format: paperRecord.format,
    title: paperRecord.title,
    subject: paperRecord.subject,
    course_code: paperRecord.course_code || undefined,
    model: paperRecord.model,
    credits_charged: paperRecord.credits_charged,
    validation_attempts: paperRecord.validation_attempts,
    created_at: paperRecord.created_at,
    paper: paperRecord.paper as PaperJson,
  };

  return <PaperPrint paperRecord={safeRecord} />;
}
