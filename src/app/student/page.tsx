import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Layers,
  ShieldCheck,
  LogOut,
  Clock,
  FileText,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { AdminBar } from "@/components/navigation/admin-bar";
import { signOutAction } from "@/app/auth/actions";
import { isAdminEmail } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Student Cram Suite — KalExamHai",
};

async function StudentContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/student");
  }

  const isAdmin = isAdminEmail(user.email);
  const adminClient = getAdminClient();

  // Fetch recent cram artifacts
  const { data: recentArtifacts } = await adminClient
    .from("cram_artifacts")
    .select("id, title, subject, artifact_type, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Free Launch Access Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-[6px] shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Free Launch Access Active: 3 AI Generations Per Day</h3>
            <p className="text-xs text-blue-100 mt-0.5">
              Enjoy 3 free study sessions every day (3D Flashcards, Formulas &amp; Viva Prep) plus 1 free Survival Kit trial. Quota resets at midnight IST!
            </p>
          </div>
        </div>
        <Link
          href="/student/cram/new"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-white rounded-[6px] hover:bg-blue-50 transition-colors shrink-0 shadow-xs"
        >
          <span>Start Cramming &rarr;</span>
        </Link>
      </div>

      {/* Welcome Section */}
        <div className="bg-white rounded-xl border border-[#E7E5E0] p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] mb-2">
              <Clock className="w-4 h-4" />
              <span>Built for the Final 24–72 Hours Before Exam</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2937]">
              Welcome, {user.user_metadata?.full_name || "Student"}
            </h1>
            <p className="mt-2 text-sm text-[#4B5563] leading-relaxed">
              Cut through 400 pages of textbook fluff. Study high-probability questions, 3D memory flashcards, and verified viva formulas generated directly from Mumbai University semester modules.
            </p>
          </div>

          {/* Quick Action Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. 3D Holo Flashcards */}
            <Link
              href="/student/cram/new?type=flashcards"
              className="p-5 rounded-lg border border-[#E7E5E0] bg-[#F9F9F6] hover:bg-white hover:border-blue-500 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-blue-100 text-[#2563EB] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#1F2937] group-hover:text-[#2563EB] transition-colors">
                  3D Holo Flashcards
                </h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  Interactive 3D tilt deck with flip &amp; active recall ("Mastered" vs "Need Revision").
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E7E5E0] text-xs font-semibold text-[#2563EB] flex items-center justify-between">
                <span>Start Review Deck</span>
                <span className="text-[#2563EB]">&rarr;</span>
              </div>
            </Link>

            {/* 2. Quick Notes & Formula Sheets */}
            <Link
              href="/student/cram/new?type=quick_notes"
              className="p-5 rounded-lg border border-[#E7E5E0] bg-[#F9F9F6] hover:bg-white hover:border-emerald-500 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#1F2937] group-hover:text-emerald-700 transition-colors">
                  Quick Notes &amp; Formulas
                </h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  High-yield derivations, definitions, algorithms, and exam traps formatted with KaTeX.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E7E5E0] text-xs font-semibold text-emerald-700 flex items-center justify-between">
                <span>Generate Formula Sheet</span>
                <span className="text-emerald-700">&rarr;</span>
              </div>
            </Link>

            {/* 3. Examiner Viva Prep */}
            <Link
              href="/student/cram/new?type=viva_prep"
              className="p-5 rounded-lg border border-[#E7E5E0] bg-[#F9F9F6] hover:bg-white hover:border-purple-500 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#1F2937] group-hover:text-purple-700 transition-colors">
                  Examiner Viva Prep
                </h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  Oral defense Q&amp;A triaged into Easy, Medium, and Tricky professor trap gotchas.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E7E5E0] text-xs font-semibold text-purple-700 flex items-center justify-between">
                <span>Practice Oral Defenses</span>
                <span className="text-purple-700">&rarr;</span>
              </div>
            </Link>

            {/* 4. Last-Minute Survival Kit */}
            <Link
              href="/student/cram/new?type=survival_kit"
              className="p-5 rounded-lg border border-[#E7E5E0] bg-[#F9F9F6] hover:bg-white hover:border-red-500 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-red-100 text-red-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#1F2937] group-hover:text-red-700 transition-colors">
                  Last-Minute Survival Kit
                </h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  12–24h panic-window roadmap, expected marks rankings, and pass guarantee checklist.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E7E5E0] text-xs font-semibold text-red-700 flex items-center justify-between">
                <span>View 24h Triage</span>
                <span className="text-red-700">&rarr;</span>
              </div>
            </Link>

            {/* 5. Practice Exam Paper Generator */}
            <Link
              href="/student/papers/generate"
              className="p-5 rounded-lg border border-[#E7E5E0] bg-[#F9F9F6] hover:bg-white hover:border-[#2563EB] transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-blue-100 text-[#2563EB] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#1F2937] group-hover:text-[#2563EB] transition-colors">
                  Practice Exam Paper
                </h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  Generate strict 20M IAT or 60M End-Sem question papers with marking schemes.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E7E5E0] text-xs font-semibold text-[#2563EB] flex items-center justify-between">
                <span>Generate Practice Paper</span>
                <span className="text-[#2563EB]">&rarr;</span>
              </div>
            </Link>

            {/* 6. Knowledge Library */}
            <Link
              href="/student/library"
              className="p-5 rounded-lg border border-[#E7E5E0] bg-[#F9F9F6] hover:bg-white hover:border-slate-400 transition-all flex flex-col justify-between group cursor-pointer shadow-xs"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#1F2937] group-hover:text-slate-900 transition-colors">
                  My Syllabus Library
                </h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  Upload PDF slides, notes, or paste syllabus units for context-only RAG study.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E7E5E0] text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Manage Library</span>
                <span>&rarr;</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Study Sessions */}
        {recentArtifacts && recentArtifacts.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E7E5E0] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recent Study Sessions ({recentArtifacts.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Quickly jump back into your previously generated flashcards and notes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentArtifacts.map((art) => (
                <Link
                  key={art.id}
                  href={`/student/cram/${art.id}`}
                  className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-500 rounded-lg transition-all group flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        {art.artifact_type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(art.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {art.title}
                    </h3>
                    {art.subject && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{art.subject}</p>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-semibold text-blue-600 flex items-center justify-between">
                    <span>Open Session</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      {/* Footer Links */}
      <footer className="pt-8 pb-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div>KalExamHai &bull; Built for Mumbai University Students</div>
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

export default function StudentDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F6] flex items-center justify-center text-sm text-[#6B7280]">
          Loading student workspace...
        </div>
      }
    >
      <StudentContent />
    </Suspense>
  );
}
