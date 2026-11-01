"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckSquare,
  Square,
  Award,
  Layers,
  Sparkles,
} from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { MathText } from "@/components/ui/math-text";
import type { SurvivalKitPayload } from "@/lib/schemas/cram";

interface SurvivalKitViewProps {
  payload: SurvivalKitPayload;
}

export function SurvivalKitView({ payload }: SurvivalKitViewProps) {
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

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
            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-[6px]">
              Last-Minute Survival Kit (12–24h)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{payload.title}</p>
        </div>
      </div>

      {/* Panic Timeline Roadmap */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-red-600" />
          Prioritized Panic-Window Study Roadmap
        </h2>

        <div className="space-y-3">
          {payload.panic_timeline_roadmap.map((slot, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900">{slot.window}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  Action Item
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium">{slot.action}</p>
              {slot.target_topics && slot.target_topics.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {slot.target_topics.map((t, ti) => (
                    <span
                      key={ti}
                      className="text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Priority Topics Ranked by Expected Marks */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          High-Yield Topics Ranked by Expected Marks
        </h2>

        <div className="space-y-4">
          {payload.priority_topics.map((top, i) => (
            <div key={i} className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-slate-900 text-white rounded">
                      #{top.importance_rank || i + 1}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{top.title}</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{top.module_name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 shrink-0">
                  ~{top.expected_marks} Marks
                </span>
              </div>

              {/* Summary Points */}
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 pl-1">
                {top.summary_points.map((pt, pi) => (
                  <li key={pi}>
                    <MathText content={pt} />
                  </li>
                ))}
              </ul>

              {/* Must-Draw Diagram */}
              {top.must_draw_diagram && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded text-xs text-blue-900">
                  <span className="font-bold">Must-Draw Diagram: </span>
                  {top.must_draw_diagram}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pass Guarantee Checklist */}
      {payload.pass_guarantee_checklist.length > 0 && (
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Pass-Mark Guarantee Checklist
            </h2>
            <span className="text-[11px] font-semibold text-emerald-700">
              {checkedItems.length} of {payload.pass_guarantee_checklist.length} Completed
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {payload.pass_guarantee_checklist.map((item, i) => {
              const isChecked = checkedItems.includes(i);
              return (
                <div
                  key={i}
                  onClick={() => toggleCheck(i)}
                  className={`p-3 rounded-lg border text-xs flex items-center gap-3 cursor-pointer transition-colors ${
                    isChecked
                      ? "bg-emerald-100/70 border-emerald-300 text-emerald-900 line-through"
                      : "bg-white border-emerald-200 text-slate-800 hover:bg-emerald-50/30"
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="flex-1 font-medium">{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

