"use client";

import React, { useState } from "react";
import {
  Printer,
  Copy,
  Check,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Share2,
} from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { MathText } from "@/components/ui/math-text";
import type { QuickNotesPayload } from "@/lib/schemas/cram";

interface QuickNotesViewProps {
  payload: QuickNotesPayload;
}

export function QuickNotesView({ payload }: QuickNotesViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      let text = `${payload.subject} — High-Yield Formula Notes\n\n`;
      text += `OVERVIEW:\n${payload.high_yield_summary}\n\n`;
      text += `DEFINITIONS:\n${payload.core_definitions.map((d) => `• ${d.term}: ${d.definition}`).join("\n")}\n\n`;
      text += `FORMULAS:\n${payload.formulas_and_derivations.map((f) => `• ${f.title}: ${f.formula_latex} (${f.explanation})`).join("\n")}\n\n`;
      text += `EXAM HALL TRAPS:\n${payload.exam_hall_traps.map((t) => `! ${t}`).join("\n")}\n`;

      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy notes.");
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `📑 *${payload.subject} — High-Yield Formula Notes*\n` +
      `Check out these quick revision notes & formulas for Mumbai University on KalExamHai:\n` +
      `${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="mb-1">
            <BackButton fallbackUrl="/student" label="Back to Student Portal" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {payload.subject}
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[6px]">
              High-Yield Formula Notes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{payload.title}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[6px] hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Notes"}</span>
          </button>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-[6px] hover:bg-emerald-100 shadow-sm transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-[6px] hover:bg-slate-800 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* High-Yield Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-2">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          High-Yield Chapter Summary
        </h2>
        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          <MathText content={payload.high_yield_summary} />
        </div>
      </div>

      {/* Formulas & Derivations */}
      {payload.formulas_and_derivations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            Core Formulas &amp; Numerical Equations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {payload.formulas_and_derivations.map((f, i) => (
              <div key={i} className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <h3 className="text-xs font-bold text-slate-900 leading-snug">
                  <MathText content={f.title} />
                </h3>
                <div className="py-2 px-3 bg-white border border-slate-200 rounded-md text-center text-sm font-serif overflow-x-auto max-w-full">
                  <MathText content={f.formula_latex} />
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  <MathText content={f.explanation} />
                </div>
                {f.variables && f.variables.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex flex-wrap gap-1.5">
                    {f.variables.map((v, vi) => (
                      <span key={vi} className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        <MathText content={v} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Core Definitions */}
      {payload.core_definitions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Key Exam Definitions
          </h2>
          <div className="divide-y divide-slate-100">
            {payload.core_definitions.map((def, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
                  <span className="font-bold text-xs text-slate-900 sm:w-1/3 sm:shrink-0 leading-snug">
                    <MathText content={def.term} />
                  </span>
                  <div className="text-xs text-slate-700 text-left sm:w-2/3 leading-relaxed mt-0.5 sm:mt-0">
                    <MathText content={def.definition} />
                    {def.formula && (
                      <div className="mt-1.5 sm:mt-1">
                        <span className="font-mono text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-[5px] inline-block max-w-full overflow-x-auto">
                          <MathText content={def.formula} />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step-by-Step Algorithms */}
      {payload.step_by_step_algorithms.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Step-by-Step Algorithm Walkthroughs
          </h2>
          <div className="space-y-3">
            {payload.step_by_step_algorithms.map((algo, i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  <MathText content={algo.title} />
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
                  {algo.steps.map((step, si) => (
                    <li key={si}>
                      <MathText content={step} />
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exam Hall Traps */}
      {payload.exam_hall_traps.length > 0 && (
        <div className="bg-red-50/60 border border-red-200 rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Exam Hall Traps &amp; Common Blunders
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-red-800 leading-relaxed">
            {payload.exam_hall_traps.map((trap, i) => (
              <li key={i}>
                <MathText content={trap} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

