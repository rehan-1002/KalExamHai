"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sparkles,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { generatePaperAction } from "@/app/tutor/generate/actions";
import type { PaperFormat } from "@/lib/schemas/paper";

interface DocumentOption {
  id: string;
  title: string;
  subject: string | null;
  page_count: number | null;
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

interface GenerateWizardProps {
  documents: DocumentOption[];
  creditBalance: number;
  initialFormat?: PaperFormat;
  quota?: QuotaInfo;
}

export function GenerateWizard({ documents, creditBalance, initialFormat, quota }: GenerateWizardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isStudent = pathname?.startsWith("/student") ?? false;
  const [selectedFormat, setSelectedFormat] = useState<PaperFormat>(initialFormat || "IAT");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(() => {
    const readyDocs = documents.filter((d) => d.status === "ready");
    return readyDocs.length > 0 ? [readyDocs[0]!.id] : [];
  });
  const [subject, setSubject] = useState(() => {
    const firstReady = documents.find((d) => d.status === "ready");
    return firstReady?.subject || firstReady?.title || "";
  });
  const [courseCode, setCourseCode] = useState("");
  const [instituteName, setInstituteName] = useState("University of Mumbai");
  const [examTitle, setExamTitle] = useState("");
  const [difficulty, setDifficulty] = useState<"balanced" | "easy" | "rigorous">("balanced");

  const [isPending, startTransition] = useTransition();
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  useEffect(() => {
    try {
      const lastGen = localStorage.getItem("keh_last_paper_gen");
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

  const creditCost = selectedFormat === "IAT" ? 1 : 2;
  const hasEnoughCredits = creditBalance >= creditCost;

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocIds.length === 0) {
      setErrorMessage("Please select at least one syllabus/notes document.");
      return;
    }
    if (!subject.trim()) {
      setErrorMessage("Please enter the course/subject name.");
      return;
    }

    setErrorMessage(null);
    setStatusStep("Reserving credits and retrieving syllabus chunks...");

    startTransition(async () => {
      try {
        setStatusStep("Orchestrating Gemini 2.5 Flash with strict context-only RAG...");
        const result = await generatePaperAction({
          documentIds: selectedDocIds,
          format: selectedFormat,
          subject: subject.trim(),
          courseCode: courseCode.trim() || undefined,
          instituteName: instituteName.trim() || undefined,
          examTitle: examTitle.trim() || undefined,
          difficulty,
        });

        if (result.ok) {
          try {
            localStorage.setItem("keh_last_paper_gen", Date.now().toString());
          } catch {}
          setCooldownSeconds(45);
          setStatusStep("Verifying NEP-2020 mark distribution in code...");
          setTimeout(() => {
            const redirectTarget = isStudent
              ? `/student/papers/${result.data.paperId}`
              : `/tutor/papers/${result.data.paperId}`;
            router.push(redirectTarget);
          }, 800);
        } else {
          setStatusStep(null);
          setErrorMessage(result.message);
        }
      } catch (err: unknown) {
        setStatusStep(null);
        setErrorMessage(err instanceof Error ? err.message : "Paper generation failed.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* 1. Exam Format Selection */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E7E5E0] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#1F2937]">1. Select Examination Blueprint</h3>
            <p className="text-xs text-[#6B7280]">
              Engineered strictly to Mumbai University NEP-2020 format specifications.
            </p>
          </div>
          <div className="text-xs">
            {quota?.isUnlimited ? (
              <span className="font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-[6px] border border-purple-200">
                ⚡ Unlimited (Admin)
              </span>
            ) : (
              <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-[6px] border border-blue-200" title={`Resets at ${quota?.resetsAtFormatted || "12:00 AM IST"}`}>
                ⚡ Daily Free Quota: {quota ? `${quota.remainingToday}/${quota.totalDailyLimit}` : `${creditBalance}`} Left Today
              </span>
            )}
          </div>
        </div>

        {/* Quota Exhaustion Warning */}
        {quota && !quota.isUnlimited && quota.remainingToday <= 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-[6px] p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Daily Free Quota Reached (3/3 Used)</strong>
              <p className="mt-0.5 text-amber-700">
                You have reached your daily limit of 3 free question paper generations. Your quota will reset tonight at {quota.resetsAtFormatted}.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* IAT Blueprint Card */}
          <div
            onClick={() => !isPending && setSelectedFormat("IAT")}
            className={`p-5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
              selectedFormat === "IAT"
                ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]"
                : "border-[#E7E5E0] bg-[#F9F9F6] hover:bg-[#FFFFFF]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-[5px] bg-[#2563EB] text-white">
                  IAT Paper
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px] border border-emerald-200">
                  Free (Daily Quota)
                </span>
              </div>
              <h4 className="text-base font-bold text-[#1F2937]">20 Marks (Internal Assessment)</h4>
              <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                Q1 Compulsory (attempt 5 of 6 sub-questions, 2M each = 10M) + Q2 and Q3 with internal choice (5M each = 10M).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E7E5E0]/60 flex items-center justify-between text-xs text-[#6B7280]">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 60 Minutes
              </span>
              <span>3 Questions Total</span>
            </div>
          </div>

          {/* End-Sem Blueprint Card */}
          <div
            onClick={() => !isPending && setSelectedFormat("END_SEM")}
            className={`p-5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
              selectedFormat === "END_SEM"
                ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]"
                : "border-[#E7E5E0] bg-[#F9F9F6] hover:bg-[#FFFFFF]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-[5px] bg-[#1E40AF] text-white">
                  End-Sem Paper
                </span>
                {quota?.premiumTrialsUsed.endSem ? (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[5px] border border-amber-200" title="Resets at midnight">
                    1/1 Daily Trial Used
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px] border border-emerald-200">
                    1 Free Daily Trial
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-[#1F2937]">60 Marks (Semester Examination)</h4>
              <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                Q1 Compulsory (attempt 4 of 6, 5M each = 20M) + Q2..Q6 (attempt any 4 of 5, 10M each = 40M). Total: 60M.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E7E5E0]/60 flex items-center justify-between text-xs text-[#6B7280]">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 120 Minutes
              </span>
              <span>6 Questions Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Select Source Documents */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E7E5E0] p-6 shadow-sm">
        <h3 className="text-base font-semibold text-[#1F2937]">2. Select Source Notes &amp; Syllabus</h3>
        <p className="text-xs text-[#6B7280] mt-0.5 mb-4">
          All questions and formulas will be strictly retrieved from these embedded documents.
        </p>

        {documents.length === 0 ? (
          <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800">
            No documents available. Please upload notes in the Document Library first.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto">
            {documents.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              const isReady = doc.status === "ready";

              return (
                <div
                  key={doc.id}
                  onClick={() => isReady && !isPending && toggleDocSelection(doc.id)}
                  className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    !isReady
                      ? "opacity-50 border-dashed border-[#E7E5E0] cursor-not-allowed"
                      : isSelected
                      ? "border-[#2563EB] bg-[#EFF6FF] cursor-pointer"
                      : "border-[#E7E5E0] bg-[#FFFFFF] hover:border-[#3B82F6] cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!isReady || isPending}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-xs text-[#1F2937] block truncate">
                      {doc.title}
                    </span>
                    <span className="text-[11px] text-[#6B7280] block truncate">
                      {doc.subject || "No subject label"} • {doc.page_count || 1} p.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Paper Parameters */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E7E5E0] p-6 shadow-sm">
        <h3 className="text-base font-semibold text-[#1F2937] mb-4">3. Paper Header &amp; Metadata</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-1">
              Subject / Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Design and Analysis of Algorithms"
              required
              disabled={isPending}
              className="w-full h-9 px-3 rounded-md border border-[#E7E5E0] bg-[#FFFFFF] text-sm text-[#1F2937] focus-visible:outline-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-1">
              Course Code (Optional)
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. CSC402, IT501"
              disabled={isPending}
              className="w-full h-9 px-3 rounded-md border border-[#E7E5E0] bg-[#FFFFFF] text-sm text-[#1F2937] focus-visible:outline-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-1">
              Institution / College Name
            </label>
            <input
              type="text"
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
              placeholder="e.g. University of Mumbai / College Name"
              disabled={isPending}
              className="w-full h-9 px-3 rounded-md border border-[#E7E5E0] bg-[#FFFFFF] text-sm text-[#1F2937] focus-visible:outline-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-1">
              Difficulty Mix
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "balanced")}
              disabled={isPending}
              className="w-full h-9 px-3 rounded-md border border-[#E7E5E0] bg-[#FFFFFF] text-sm text-[#1F2937] focus-visible:outline-[#2563EB]"
            >
              <option value="balanced">Balanced (Mumbai University Standard)</option>
              <option value="rigorous">Rigorous (Higher derivation &amp; problem weight)</option>
              <option value="easy">Conceptual (Definitions &amp; fundamentals focus)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status or Error Display */}
      {isPending && statusStep && (
        <div className="p-4 rounded-md bg-[#EFF6FF] border border-blue-200 text-xs text-[#1E40AF] flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin shrink-0" />
          <span>{statusStep}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-md bg-[#FEF3F2] border border-red-200 text-xs text-[#B42318] flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Generation Failed: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#FFFFFF] border border-[#E7E5E0] shadow-sm">
        <div className="text-xs text-[#6B7280]">
          Total Cost: <strong className="text-[#1F2937]">{creditCost} Credit{creditCost > 1 ? "s" : ""}</strong>
          {!hasEnoughCredits && <span className="text-[#B42318] ml-2 font-medium">(Insufficient Balance)</span>}
        </div>

        <button
          type="submit"
          disabled={isPending || cooldownSeconds > 0 || !hasEnoughCredits || selectedDocIds.length === 0 || !subject.trim()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2563EB] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-[#2563EB]"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Paper...</span>
            </>
          ) : cooldownSeconds > 0 ? (
            <>
              <Clock className="w-4 h-4 text-amber-300 animate-spin" />
              <span>Cooldown Active ({cooldownSeconds}s)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate NEP-2020 Paper ({creditCost} Credit{creditCost > 1 ? "s" : ""})</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
