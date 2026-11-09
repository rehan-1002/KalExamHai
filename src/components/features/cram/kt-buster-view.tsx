"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckSquare,
  Square,
  Award,
  BookOpen,
  Printer,
  Copy,
  Check,
  Share2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Flame,
  Info,
} from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { MathText } from "@/components/ui/math-text";
import type { KtBusterPayload } from "@/lib/schemas/cram";

interface KtBusterViewProps {
  payload: KtBusterPayload;
}

export function KtBusterView({ payload }: KtBusterViewProps) {
  const storageKey = `keh_kt_buster_checked_${payload.subject.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`;

  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  // Restore checked items from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCheckedIds(parsed);
      }
    } catch {
      // safe fallback
    }
  }, [storageKey]);

  // Persist checked items
  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleExpandQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Calculate current marks scored from checked checklist items
  const currentMarks = useMemo(() => {
    return payload.pass_checklist.reduce((sum, item) => {
      return checkedIds.includes(item.id) ? sum + item.marks : sum;
    }, 0);
  }, [payload.pass_checklist, checkedIds]);

  const passingThreshold = payload.passing_threshold || 24;
  const safeTargetMarks = payload.target_safe_marks || 32;

  // Percentage for progress bar (capped at 100%)
  const progressPercent = Math.min(100, Math.round((currentMarks / safeTargetMarks) * 100));

  // Determine passing tier
  const tier = useMemo(() => {
    if (currentMarks >= safeTargetMarks) {
      return {
        label: "🛡️ 100% KT-PROOF (CUSHION SECURED)",
        textColor: "text-emerald-800",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-300",
        barColor: "bg-gradient-to-r from-emerald-500 to-indigo-600",
        message: `Outstanding! You have secured ${currentMarks} Marks, well above the 24M passing mark with a safe cushion against strict examiners.`,
      };
    }
    if (currentMarks >= passingThreshold) {
      return {
        label: "🎉 24M PASSED! (THRESHOLD CLEARED)",
        textColor: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-300",
        barColor: "bg-emerald-600",
        message: `You hit ${currentMarks}/${passingThreshold} Marks! Theoretical passing secured. Complete 1-2 more items to lock in an 8-mark safe cushion!`,
      };
    }
    if (currentMarks >= Math.floor(passingThreshold / 2)) {
      return {
        label: "🟡 HALFWAY (BORDERLINE ZONE)",
        textColor: "text-amber-800",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-300",
        barColor: "bg-amber-500",
        message: `Currently at ${currentMarks} Marks. You need ${passingThreshold - currentMarks} more marks to clear the 24M passing cutoff!`,
      };
    }
    return {
      label: "🔴 DANGER ZONE (KT AT-RISK)",
      textColor: "text-rose-800",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      barColor: "bg-rose-500",
      message: `Currently at ${currentMarks} Marks. Check off topics as you prepare them to cross the 24-mark threshold!`,
    };
  }, [currentMarks, passingThreshold, safeTargetMarks]);

  const handleCopy = async () => {
    try {
      let text = `🛡️ ${payload.subject} — KT BUSTER 24-MARK PASS STRATEGY (MU NEP-2020)\n\n`;
      text += `🎯 Passing Threshold: ${passingThreshold}/60 Marks | Target Safe: ${safeTargetMarks} Marks\n\n`;
      text += `⭐ 2 GOLDEN MODULES TO MASTER:\n`;
      payload.golden_modules.forEach((gm) => {
        text += `• Module ${gm.module_no}: ${gm.module_title} (~${gm.weightage_marks}M) -> ${gm.why_easy}\n`;
      });
      text += `\n🔥 TOP REPEATING PYQ QUESTIONS:\n`;
      payload.fixed_repeating_questions.forEach((q, idx) => {
        text += `${idx + 1}. [${q.marks}M | Module ${q.module_no}] ${q.question_text} (Repeated ${q.repeat_count_mu}x)\n`;
      });
      text += `\n📐 3 MUST-DRAW HIGH-VALUE DIAGRAMS:\n`;
      payload.must_draw_diagrams.forEach((d) => {
        text += `• ${d.title} [${d.marks_value}M]: ${d.diagram_description}\n`;
      });

      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy strategy.");
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🛡️ *${payload.subject} — KT Buster (24-Mark Pass Strategy)*\n` +
      `Don't study all 6 modules! Master these 2 Golden Modules and Top repeating questions to score 24-32 marks in Mumbai University.\n` +
      `Check it out on KalExamHai: ${window.location.href}`
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
            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-[6px] flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              KT Buster (24M Pass Strategy)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mumbai University NEP-2020 • Passing Cutoff: 24/60 Marks • 5M &amp; 6M Subparts
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[6px] hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
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
            <span>Print Strategy</span>
          </button>
        </div>
      </div>

      {/* Reactive 24-Mark Passing Tracker Bar */}
      <div className={`p-4 sm:p-5 rounded-xl border shadow-sm transition-all ${tier.bgColor} ${tier.borderColor}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            {currentMarks >= passingThreshold ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div>
              <span className={`text-xs font-extrabold uppercase tracking-wider ${tier.textColor}`}>
                {tier.label}
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5">{tier.message}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {currentMarks}
            </span>
            <span className="text-xs font-bold text-slate-500"> / {passingThreshold} Marks</span>
            <span className="block text-[10px] text-slate-500 font-medium">
              Target Safe: {safeTargetMarks}M
            </span>
          </div>
        </div>

        {/* Progress bar with milestones */}
        <div className="relative mt-3">
          <div className="w-full bg-slate-200 h-3 rounded-[6px] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${tier.barColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mt-1.5 px-0.5">
            <span>0 Marks</span>
            <span className="text-amber-700">12M (Halfway)</span>
            <span className="text-emerald-700 font-bold">24M (Pass Cutoff)</span>
            <span className="text-indigo-700 font-bold">32M (KT-Proof)</span>
          </div>
        </div>
      </div>

      {/* Strategy Rule Banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Golden Rule for Tonight:</strong> Do NOT attempt to read all 6 modules. In Mumbai University, attempting 6 modules in a rush leads to superficial answers that fail. Master the <strong>2 Golden Modules</strong> and <strong>6 high-yield questions</strong> below to guarantee passing marks.
        </div>
      </div>

      {/* 1. Golden Modules Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            The 2 Golden Modules (Surgical Focus)
          </h2>
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-[5px] border border-amber-200">
            Yields 24–28 Marks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {payload.golden_modules.map((m, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-[5px] border border-indigo-200">
                  Module {m.module_no}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  ~{m.weightage_marks} Marks
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                {m.module_title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {m.why_easy}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top 6 Fixed Repeating PYQs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500 shrink-0" />
            Top Repeating PYQs (MU Exam Hall Killers)
          </h2>
          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-[5px]">
            Strict 5M &amp; 6M NEP-2020 Format
          </span>
        </div>

        <div className="space-y-3">
          {payload.fixed_repeating_questions.map((q, idx) => {
            const isExpanded = !!expandedQuestions[q.id];
            return (
              <div
                key={q.id || idx}
                className="p-3.5 sm:p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2.5 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-[5px] border border-orange-200 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        Repeated {q.repeat_count_mu}x in MU
                      </span>
                      <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-[5px] border border-blue-200">
                        Module {q.module_no}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-[5px]">
                        ~{q.probability_percentage}% Repeat Probability
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 pt-1 leading-snug">
                      <span className="text-slate-500 mr-1.5">Q{idx + 1}.</span>
                      <MathText content={q.question_text} />
                    </h3>
                  </div>

                  <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-[6px] border border-slate-200 shrink-0 self-start">
                    {q.marks} Marks
                  </span>
                </div>

                {/* Repeat sessions context */}
                {q.repeat_sessions && (
                  <p className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Exam Sessions:</span> {q.repeat_sessions}
                  </p>
                )}

                {/* Collapsible Step-Marking Breakdown */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggleExpandQuestion(q.id)}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Hide Examiner Step Marking Key &amp; Points
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        View Examiner Step Marking Key &amp; Points ({q.step_marking_breakdown.length} Steps)
                      </>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 p-3 bg-white border border-slate-200 rounded-[6px] space-y-2.5 text-xs text-slate-700">
                      {q.step_marking_breakdown.length > 0 && (
                        <div>
                          <strong className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block mb-1">
                            Examiner Step-Marking Breakdown:
                          </strong>
                          <ul className="space-y-1 pl-1">
                            {q.step_marking_breakdown.map((step, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-1.5 text-slate-700">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <MathText content={step} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {q.key_answer_bullets && q.key_answer_bullets.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-100">
                          <strong className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block mb-1">
                            Mandatory Evaluator Keywords &amp; Bullets:
                          </strong>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                            {q.key_answer_bullets.map((bullet, bIdx) => (
                              <li key={bIdx}>
                                <MathText content={bullet} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Must-Draw High-Value Diagrams */}
      {payload.must_draw_diagrams.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              3 Must-Draw High-Value Diagrams
            </h2>
            <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-[5px] border border-blue-200">
              Free 10–12 Marks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {payload.must_draw_diagrams.map((d, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg space-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                      Module {d.module_no}
                    </span>
                    <span className="text-xs font-bold text-blue-900">
                      +{d.marks_value} Marks
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">
                    {d.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    <MathText content={d.diagram_description} />
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-blue-700 mt-2 block">
                  💡 Evaluators award marks for clean labels even if theory is short!
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Interactive 24-Mark Passing Checklist */}
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              24-Mark Passing Guarantee Checklist
            </h2>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Check off tasks as you prepare them. The marks counter at the top will update in real time!
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-[6px] self-start sm:self-auto">
            {checkedIds.length} of {payload.pass_checklist.length} Completed ({currentMarks}M)
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {payload.pass_checklist.map((item) => {
            const isChecked = checkedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isChecked
                    ? "bg-emerald-100/70 border-emerald-300 text-emerald-900 line-through"
                    : "bg-white border-emerald-200 text-slate-800 hover:bg-emerald-50/40"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="font-medium leading-relaxed">
                    <MathText content={item.task} />
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.is_critical && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Critical
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    +{item.marks}M
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

