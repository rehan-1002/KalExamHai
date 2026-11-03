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
} from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { generateCramItemAction } from "@/app/student/cram/actions";
import { Skeleton } from "@/components/ui/skeleton";
import type { CramArtifactType } from "@/lib/schemas/cram";

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

  const [selectedDocId, setSelectedDocId] = useState<string>(() => {
    if (initialDocId && readyDocs.some((d) => d.id === initialDocId)) {
      return initialDocId;
    }
    return readyDocs.length > 0 ? readyDocs[0]!.id : "";
  });

  const [selectedType, setSelectedType] = useState<CramArtifactType>(
    initialType || "flashcards"
  );

  const [subject, setSubject] = useState(() => {
    const active = readyDocs.find((d) => d.id === selectedDocId);
    return active?.subject || active?.title || "";
  });

  const [isPending, startTransition] = useTransition();
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

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
    if (!selectedDocId) {
      setErrorMessage("Please select a syllabus document from your library.");
      return;
    }

    setErrorMessage(null);
    setStatusStep("Retrieving syllabus chunks from pgvector...");

    startTransition(async () => {
      try {
        setStatusStep("Extracting high-yield concepts with Gemini 3.5 Flash...");
        const res = await generateCramItemAction({
          documentIds: [selectedDocId],
          artifactType: selectedType,
          subject: subject.trim() || undefined,
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

  if (readyDocs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
        <FileText className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">No Ready Documents Found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Please upload your semester syllabus or lecture notes first before generating flashcards or quick notes.
        </p>
        <Link
          href="/student/library"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-[6px] hover:bg-blue-700 transition-colors"
        >
          Go to Knowledge Library &rarr;
        </Link>
      </div>
    );
  }

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

      {/* 1. Document Selection */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
          1. Select Source Document
        </label>
        <select
          value={selectedDocId}
          disabled={isPending}
          onChange={(e) => handleDocChange(e.target.value)}
          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium"
        >
          {readyDocs.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.title} {doc.subject ? `(${doc.subject})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Cram Tool Selection */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
          2. Choose Study Tool
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

