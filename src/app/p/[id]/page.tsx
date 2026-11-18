import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles, ShieldCheck, GraduationCap } from "lucide-react";
import { getAdminClient } from "@/server/supabase/admin";
import { PaperView } from "@/components/features/papers/paper-view";
import type { PaperJson } from "@/lib/schemas/paper";

interface PublicPaperPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PublicPaperPageProps): Promise<Metadata> {
  const { id } = await params;
  const adminClient = getAdminClient();

  const { data: paperRecord } = await adminClient
    .from("generated_papers")
    .select("subject, format, title")
    .eq("id", id)
    .maybeSingle();

  if (!paperRecord) {
    return {
      title: "Question Paper Not Found — KalExamHai",
      description: "Mumbai University Exam Question Paper on KalExamHai.",
    };
  }

  const formatLabel = paperRecord.format === "IAT" ? "IAT 20 Marks" : "End-Sem 60 Marks";
  const title = `🚨 ${paperRecord.subject} (${formatLabel}) Predicted Paper | MU NEP-2020`;
  const description = `Official Mumbai University NEP-2020 predicted question paper with complete step-by-step marking scheme and engineering diagrams.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://kalexamhai-one.vercel.app/p/${id}`,
      siteName: "KalExamHai — MU Exam Prep Engine",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicPaperPage({ params }: PublicPaperPageProps) {
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

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-slate-900 flex flex-col font-sans">
      {/* 1. Viral Top Floating Header */}
      <header className="sticky top-0 z-50 bg-[#0F172A] text-white border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-base font-black shadow-xs">
                K
              </span>
              <div>
                <span className="text-sm font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  KalExamHai
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded-full border border-blue-700/50">
                  MU NEP-2020 Engine
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 mr-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict University Blueprint</span>
            </div>
            <Link
              href="/student/papers/generate"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Generate for Your Subject (Free)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. NEP-2020 Trust Banner */}
      <div className="bg-blue-50/80 border-b border-blue-100 py-2.5 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-blue-900 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Mumbai University NEP-2020 Verified:</strong> This predicted paper follows official module weightages, Q1 compulsory short notes, and step marking schemes.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
            Public View Only
          </span>
        </div>
      </div>

      {/* 3. Paper View Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <PaperView paperRecord={safeRecord} isPublicShare={true} />
      </main>

      {/* 4. Bottom Viral CTA Card */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-8 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold tracking-tight">Have exams tomorrow under Mumbai University?</h3>
            <p className="text-xs text-slate-300 max-w-lg">
              Don&apos;t risk your semester. Get predicted question papers, 3D flashcards, and one-night survival kits customized for Comps, IT, AIDS, AIML, Mechanical, Civil & EXTC.
            </p>
          </div>
          <Link
            href="/student/papers/generate"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0"
          >
            <span>Start Free Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          KalExamHai — Built specifically for Mumbai University engineering students.
        </p>
      </footer>
    </div>
  );
}
