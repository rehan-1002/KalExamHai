"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { MathText } from "@/components/ui/math-text";
import type { VivaPrepPayload, VivaQuestion } from "@/lib/schemas/cram";

interface VivaPrepViewProps {
  payload: VivaPrepPayload;
}

export function VivaPrepView({ payload }: VivaPrepViewProps) {
  const [filter, setFilter] = useState<"all" | "easy" | "medium" | "tricky">("all");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredQuestions = payload.questions.filter((q) =>
    filter === "all" ? true : q.difficulty === filter
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="mb-1">
            <BackButton fallbackUrl="/student" label="Back to Student Portal" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {payload.subject}
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-[6px]">
              Examiner Viva Prep &amp; Traps
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{payload.title}</p>
        </div>

        {/* Difficulty Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(["all", "easy", "medium", "tricky"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-[5px] transition-colors capitalize ${
                filter === tab
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "all" ? "All Levels" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Banner */}
      <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-5 text-xs text-purple-900 leading-relaxed flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-1">Examiner Evaluation Strategy:</span>
          <MathText content={payload.overview} />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.map((q) => {
          const isExpanded = expandedIds.includes(q.id);

          return (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-shadow hover:shadow-sm"
            >
              {/* Question Header */}
              <button
                type="button"
                onClick={() => toggleExpand(q.id)}
                className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[5px] border shrink-0 mt-0.5 ${
                      q.difficulty === "tricky"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : q.difficulty === "medium"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {q.difficulty}
                  </span>
                  <div className="font-semibold text-xs sm:text-sm text-slate-900">
                    <MathText content={q.question} />
                  </div>
                </div>

                <div className="text-slate-400 p-1 shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded Answer & Defense */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3 bg-slate-50/40">
                  {/* Expected Spoken Answer */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      What to Say (Spoken Answer):
                    </span>
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      <MathText content={q.expected_answer} />
                    </div>
                  </div>

                  {/* Professor Examiner Trap */}
                  {q.examiner_trap && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        <span>The Examiner Trap to Watch For:</span>
                      </div>
                      <div className="text-amber-800 leading-relaxed pl-5">
                        <MathText content={q.examiner_trap} />
                      </div>
                    </div>
                  )}

                  {/* Follow-Up Defense */}
                  {q.follow_up_defense && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Follow-Up Defense if Challenged:</span>
                      </div>
                      <div className="text-blue-800 leading-relaxed pl-5">
                        <MathText content={q.follow_up_defense} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

