"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  BookOpen,
  HelpCircle,
  Clock,
  FileText,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  Flame,
} from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { generateCramItemAction } from "@/app/student/cram/actions";
import { Skeleton } from "@/components/ui/skeleton";
import type { CramArtifactType } from "@/lib/schemas/cram";
import { MuSubjectPicker } from "@/components/features/syllabus/mu-subject-picker";
import type { MuCatalogSubject } from "@/data/mu-syllabus";

interface DocumentOption {
  id: string;
  title: string;
  subject: string | null;
  status: string;
}

interface QuotaInfo {
  isUnlimited: boolean;
  remainingToday: number;
  totalDailyLimit: number;
  resetsAtFormatted: string;
  premiumTrialsUsed: {
    endSem: boolean;
    survivalKit: boolean;
    vivaPrep: boolean;
  };
}

interface CramWizardProps {
  documents: DocumentOption[];
  initialType?: CramArtifactType;
  initialDocId?: string;
  quota?: QuotaInfo;
}

export function CramWizard({ documents, initialType, initialDocId, quota }: CramWizardProps) {
  const router = useRouter();
  const readyDocs = documents.filter((d) => d.status === "ready");

  const [sourceMode, setSourceMode] = useState<"official" | "custom">("official");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("fe");
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>("BSC101");

  const [selectedDocId, setSelectedDocId] = useState<string>(() => {
    if (initialDocId && readyDocs.some((d) => d.id === initialDocId)) {
      return initialDocId;
    }
    return readyDocs.length > 0 ? readyDocs[0]!.id : "";
  });

  const [selectedType, setSelectedType] = useState<CramArtifactType>(
    initialType || "flashcards"
  );

  const [subject, setSubject] = useState("Applied Mathematics -I");

  const [isPending, startTransition] = useTransition();
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  const handleSelectMuSubject = (subj: MuCatalogSubject) => {
    setSelectedSubjectCode(subj.code);
    setSubject(subj.name);
  };

  useEffect(() => {
    try {
      const lastGen = localStorage.getItem("keh_last_cram_gen");
      if (lastGen) {
        const elapsed = Date.now() - parseInt(lastGen, 10);
        if (elapsed < 45000) {
          setCooldownSeconds(Math.ceil((45000 - elapsed) / 1000));
        }
      }
    } catch {
      // safe fallback
    }
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleDocChange = (docId: string) => {
    setSelectedDocId(docId);
    const chosen = readyDocs.find((d) => d.id === docId);
    if (chosen && !subject) {
      setSubject(chosen.subject || chosen.title);
    }
  };

  const handleGenerate = () => {
    if (sourceMode === "official") {
      if (!selectedSubjectCode || !subject.trim()) {
        setErrorMessage("Please select an official MU subject.");
        return;
      }
    } else {
      if (!selectedDocId) {
        setErrorMessage("Please select a syllabus document from your library.");
        return;
      }
    }

    setErrorMessage(null);
    setStatusStep("Extracting official syllabus & repeat question patterns...");

    startTransition(async () => {
      try {
        setStatusStep("Synthesizing high-yield concepts with Gemini 3.5 Flash...");
        const res = await generateCramItemAction({
          documentIds: sourceMode === "official" ? [`mu:${selectedSubjectCode}`] : [selectedDocId],
          artifactType: selectedType,
          subject: subject.trim() || undefined,
          title: `${subject} — ${
            selectedType === "kt_buster"
              ? "KT Buster (24M Pass Strategy)"
              : selectedType === "flashcards"
              ? "3D Holo Flashcards"
              : selectedType === "quick_notes"
              ? "High-Yield Formula Notes"
              : selectedType === "survival_kit"
              ? "Last-Minute Survival Kit"
              : "Examiner Viva Prep"
          }`,
        });

        if (res.ok && res.artifactId) {
          try {
            localStorage.setItem("keh_last_cram_gen", Date.now().toString());
          } catch {}
          setCooldownSeconds(45);
          setStatusStep("Artifact verified! Loading your session...");
          router.push(`/student/cram/${res.artifactId}`);
        } else {
          setStatusStep(null);
          setErrorMessage(res.error || "Generation failed. Please try again.");
        }
      } catch (err: unknown) {
        setStatusStep(null);
        setErrorMessage(err instanceof Error ? err.message : "Network error.");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <div className="mb-2">
              <BackButton fallbackUrl="/student" label="Previous Page" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Cram Suite Generator
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select a syllabus document to generate high-yield flashcards, formula sheets, or oral viva defenses.
            </p>
          </div>
          <div className="text-xs self-start sm:self-auto sm:mt-6">
            {quota?.isUnlimited ? (
              <span className="font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-[6px] border border-purple-200">
                ⚡ Unlimited (Admin)
              </span>
            ) : (
              <span
                className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-[6px] border border-blue-200"
                title={`Resets at ${quota?.resetsAtFormatted || "12:00 AM IST"}`}
              >
                ⚡ Daily Free Quota: {quota ? `${quota.remainingToday}/${quota.totalDailyLimit}` : "3/3"} Left Today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quota Exhaustion Warning */}
      {quota && !quota.isUnlimited && quota.remainingToday <= 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-[6px] text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Daily Free Quota Reached (3/3 Used)</strong>
            <p className="mt-0.5 text-amber-700">
              You have used all 3 free study generations for today. Your quota will reset tonight at {quota.resetsAtFormatted}.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-[6px] text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Document & Syllabus Selection */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
          <div>
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              1. Choose Syllabus &amp; Subject Source
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Select directly from official MU directory (Zero-Upload) or attach your uploaded notes.
            </p>
          </div>

          <div className="inline-flex rounded-[8px] bg-slate-100 p-1 border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setSourceMode("official")}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                sourceMode === "official"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏛️ Official MU Directory (Zero-Upload)
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceMode("custom");
                if (readyDocs.length > 0 && !selectedDocId) {
                  setSelectedDocId(readyDocs[0]!.id);
                  setSubject(readyDocs[0]!.subject || readyDocs[0]!.title || "");
                }
              }}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                sourceMode === "custom"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📁 My Uploaded Notes
            </button>
          </div>
        </div>

        {sourceMode === "official" ? (
          <MuSubjectPicker
            selectedBranchId={selectedBranchId}
            onSelectBranch={setSelectedBranchId}
            selectedSemester={selectedSemester}
            onSelectSemester={setSelectedSemester}
            selectedSubjectCode={selectedSubjectCode}
            onSelectSubject={handleSelectMuSubject}
            disabled={isPending}
          />
        ) : (
          <div>
            {readyDocs.length === 0 ? (
              <div className="p-4 rounded-[8px] bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                <div>No ready documents found in your library.</div>
                <div className="text-[11px] text-amber-700">
                  Switch to the <strong>Official MU Directory</strong> tab above to generate flashcards, formulas, and survival kits instantly with zero upload!
                </div>
              </div>
            ) : (
              <select
                value={selectedDocId}
                disabled={isPending}
                onChange={(e) => handleDocChange(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium cursor-pointer"
              >
                {readyDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} {doc.subject ? `(${doc.subject})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* 2. Cram Tool Selection */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
          2. Choose Study Tool
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 0: KT Buster (Featured) */}
          <div
            onClick={() => !isPending && setSelectedType("kt_buster")}
            className={`p-4 rounded-lg border text-left cursor-pointer transition-all col-span-1 sm:col-span-2 ${
              selectedType === "kt_buster"
                ? "bg-rose-50/70 border-rose-600 ring-1 ring-rose-600 shadow-sm"
                : "bg-gradient-to-r from-rose-50/40 via-white to-amber-50/40 border-rose-200 hover:border-rose-400 hover:bg-rose-50/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-slate-900">
                  🛡️ KT Buster (24-Mark Minimum Passing Strategy)
                </span>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-[5px]">
                  NEW • MU NEP-2020
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px] border border-emerald-200">
                Daily Free
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Surgically targets 24/60 passing marks. 2 Golden Modules + 6 repeating PYQs (strictly 5M/6M format) + 3 diagrams + live interactive marks tracker.
            </p>
          </div>

          {/* Option 1: 3D Flashcards */}
          <div
            onClick={() => !isPending && setSelectedType("flashcards")}
            className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
              selectedType === "flashcards"
                ? "bg-blue-50/60 border-blue-600 ring-1 ring-blue-600"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">3D Holo Flashcards</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px] border border-emerald-200">
                Daily Free
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Interactive 3D tilt deck with active recall sorting ("Mastered" vs "Need Revision").
            </p>
          </div>

          {/* Option 2: Quick Notes */}
          <div
            onClick={() => !isPending && setSelectedType("quick_notes")}
            className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
              selectedType === "quick_notes"
                ? "bg-emerald-50/60 border-emerald-600 ring-1 ring-emerald-600"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Quick Notes &amp; Formulas</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px] border border-emerald-200">
                Daily Free
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              High-yield summary, KaTeX formulas, algorithm walkthroughs, and exam hall traps.
            </p>
          </div>

          {/* Option 3: Viva Prep */}
          <div
            onClick={() => !isPending && setSelectedType("viva_prep")}
            className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
              selectedType === "viva_prep"
                ? "bg-purple-50/60 border-purple-600 ring-1 ring-purple-600"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-900">Examiner Viva Prep</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px] border border-emerald-200">
                Daily Free
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Spoken oral exam Q&amp;A triaged by difficulty with professor trap warnings.
            </p>
          </div>

          {/* Option 4: Survival Kit */}
          <div
            onClick={() => !isPending && setSelectedType("survival_kit")}
            className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
              selectedType === "survival_kit"
                ? "bg-red-50/60 border-red-600 ring-1 ring-red-600"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold text-slate-900">Last-Minute Survival Kit</span>
              </div>
              {quota?.premiumTrialsUsed.survivalKit ? (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[5px] border border-amber-200" title="Resets at midnight">
                  1/1 Trial Used
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px] border border-emerald-200">
                  1 Free Daily Trial
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              12–24h panic-window roadmap, expected marks rankings, and pass guarantee checklist.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Subject Name (Optional Override) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-2">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
          3. Subject Name (Optional)
        </label>
        <input
          type="text"
          value={subject}
          disabled={isPending}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Design and Analysis of Algorithms"
          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Loading Progress State with Live Study Card Skeleton */}
      {isPending && statusStep && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-[6px] text-xs text-blue-900 flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            <span className="font-medium">{statusStep}</span>
          </div>

          <div className="w-full max-w-lg mx-auto bg-white border-2 border-blue-100 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 rounded-[5px]" />
              <Skeleton className="h-4 w-16 rounded-[5px]" />
            </div>
            <div className="py-6 space-y-2">
              <Skeleton className="h-5 w-4/5 mx-auto" />
              <Skeleton className="h-5 w-3/5 mx-auto" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-3.5 w-36 rounded-[4px]" />
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={isPending || cooldownSeconds > 0 || !selectedDocId}
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-[6px] shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : cooldownSeconds > 0 ? (
            <Clock className="w-4 h-4 text-amber-300 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>
            {isPending
              ? "Generating..."
              : cooldownSeconds > 0
              ? `Cooldown Active (${cooldownSeconds}s)`
              : "Generate Study Artifact"}
          </span>
        </button>
      </div>
    </div>
  );
}

