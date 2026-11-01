import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Sparkles, FileText, Upload, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { AdminBar } from "@/components/navigation/admin-bar";
import { signOutAction } from "@/app/auth/actions";
import { isAdminEmail } from "@/lib/auth/admin";

export const metadata = {
  title: "Faculty & Tutor Portal — KalExamHai",
};

async function TutorContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/tutor");
  }

  const isAdmin = isAdminEmail(user.email);

  const adminClient = getAdminClient();

  // Fetch current credit balance
  const { data: ledgerEntry } = await adminClient
    .from("credit_ledger")
    .select("balance_after")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const creditBalance = ledgerEntry?.balance_after ?? (isAdmin ? 9999 : 2);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Free Launch Access Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-[6px] shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Free Faculty Launch: 3 AI Question Papers Per Day</h3>
            <p className="text-xs text-blue-100 mt-0.5">
              Generate up to 3 university-compliant question papers every day (IAT 20M &amp; 1 free End-Sem 60M trial). Quota resets at midnight IST!
            </p>
          </div>
        </div>
        <Link
          href="/tutor/generate"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-white rounded-[6px] hover:bg-blue-50 transition-colors shrink-0 shadow-xs"
        >
          <span>Generate Paper &rarr;</span>
        </Link>
      </div>

      {/* Welcome Section */}
        <div className="bg-white rounded-xl border border-[#E7E5E0] p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] mb-2">
              <GraduationCap className="w-4 h-4" />
              <span>Mumbai University NEP-2020 Question Paper Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2937]">
              Welcome, {user.user_metadata?.full_name || "Faculty"}
            </h1>
            <p className="mt-2 text-sm text-[#4B5563] leading-relaxed">
              Upload your syllabus and lecture notes to generate strict 20-mark Internal Assessment Tests (IAT) and 60-mark End-Semester examination papers with verified LaTeX math formulas.
            </p>
          </div>

          {/* Quick Action Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/tutor/documents"
              className="p-5 rounded-lg border border-[#E7E5E0] bg-[#F9F9F6] hover:bg-[#FFFFFF] hover:border-[#2563EB] transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-blue-100 text-[#2563EB] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#1F2937] group-hover:text-[#2563EB] transition-colors">
                  Upload Notes &amp; Syllabus
                </h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  Upload PDFs, Word docs, or paste module notes (up to 25MB) for RAG embedding.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E7E5E0] text-xs font-semibold text-[#2563EB] flex items-center justify-between">
                <span>Manage Library</span>
                <span className="text-[#2563EB]">&rarr;</span>
              </div>
            </Link>

            <Link
              href="/tutor/generate?format=IAT"
              className="p-5 rounded-lg border border-[#E7E5E0] bg-[#F9F9F6] hover:bg-[#FFFFFF] hover:border-[#2563EB] transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-blue-100 text-[#2563EB] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#1F2937] group-hover:text-[#2563EB] transition-colors">
                  Create IAT Paper (20 Marks)
                </h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  Strict Q1 compulsory (2M x 5) + Q2/Q3 internal options (5M x 2). Cost: 1 Credit.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E7E5E0] text-xs font-semibold text-[#2563EB] flex items-center justify-between">
                <span>Generate IAT</span>
                <span className="text-[#2563EB]">&rarr;</span>
              </div>
            </Link>

            <Link
              href="/tutor/generate?format=END_SEM"
              className="p-5 rounded-lg border border-[#E7E5E0] bg-[#F9F9F6] hover:bg-[#FFFFFF] hover:border-[#2563EB] transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-blue-100 text-[#2563EB] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#1F2937] group-hover:text-[#2563EB] transition-colors">
                  Create End-Sem Paper (60 Marks)
                </h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  Full 6-question blueprint with sub-question re-rolls and A4 printable PDF export. Cost: 2 Credits.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E7E5E0] text-xs font-semibold text-[#2563EB] flex items-center justify-between">
                <span>Generate End-Sem</span>
                <span className="text-[#2563EB]">&rarr;</span>
              </div>
            </Link>
          </div>
        </div>

      {/* Footer Links */}
      <footer className="pt-8 pb-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div>KalExamHai &bull; Engineered for Mumbai University NEP-2020</div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
          <Link href="/refund-policy" className="hover:text-blue-600 transition-colors">Refunds</Link>
          <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}

export default function TutorDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F6] flex items-center justify-center text-sm text-[#6B7280]">
          Loading faculty workspace...
        </div>
      }
    >
      <TutorContent />
    </Suspense>
  );
}
