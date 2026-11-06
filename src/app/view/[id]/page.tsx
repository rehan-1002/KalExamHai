import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTelegramExport } from "@/server/telegram/session";
import { TelegramPrintView } from "@/components/features/papers/telegram-print-view";

export const dynamic = "force-dynamic";

interface ViewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ViewPageProps): Promise<Metadata> {
  const { id } = await params;
  const exportData = await getTelegramExport(id);

  if (!exportData) {
    return { title: "Exam Paper Preview — KalExamHai" };
  }

  return {
    title: `${exportData.subject} (${exportData.title}) — Official Print View | KalExamHai`,
    description: `Official Mumbai University A4 format examination paper & notes for ${exportData.subject}.`,
  };
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { id } = await params;
  const exportData = await getTelegramExport(id);

  if (!exportData) {
    notFound();
  }

  return <TelegramPrintView exportData={exportData} />;
}

