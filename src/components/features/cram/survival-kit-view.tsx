"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckSquare,
  Square,
  Award,
  Layers,
  Sparkles,
  MessageCircle,
  Share2,
} from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { MathText } from "@/components/ui/math-text";
import { AudioRecapPlayer } from "@/components/ui/audio-recap-player";
import { buildSurvivalKitBroScript } from "@/lib/audio/bro-script";
import type { SurvivalKitPayload } from "@/lib/schemas/cram";

interface SurvivalKitViewProps {
  payload: SurvivalKitPayload;
}

export function SurvivalKitView({ payload }: SurvivalKitViewProps) {
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  // Countdown to next 10:30 AM IST (MU standard paper time)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 12,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calcTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      if (now.getHours() > 10 || (now.getHours() === 10 && now.getMinutes() >= 30)) {
        target.setDate(target.getDate() + 1);
      }
      target.setHours(10, 30, 0, 0);

      const diff = Math.max(0, target.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    calcTimeLeft();
    const interval = setInterval(calcTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🚨 *${payload.subject} Last-Minute Exam Night Survival Plan (12h)*\n\nPriority topics, high-scoring modules & passing checklist strictly for Mumbai University NEP-2020!\n\nPrepared on KalExamHai: https://kalexamhai.in`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

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

        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
          <span>Share with Classmates</span>
        </button>
      </div>

      {/* Live Exam Countdown Bar */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 border border-red-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-rose-300 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <span>Exam Night Countdown</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            </div>
            <div className="text-lg font-black text-white font-mono tracking-wide">
              {String(timeLeft.hours).padStart(2, "0")}h : {String(timeLeft.minutes).padStart(2, "0")}m : {String(timeLeft.seconds).padStart(2, "0")}s Left Until 10:30 AM
            </div>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-rose-200 bg-rose-950/80 px-2.5 py-1 rounded-md border border-rose-800/60 self-start sm:self-auto">
          Passing Threshold: 24 / 60M (NEP-2020)
        </span>
      </div>

      {/* Senior Topper Bro Tone Audio Briefing */}
      <AudioRecapPlayer
        subject={payload.subject}
        title="Suno Bhai! Senior Topper Audio Briefing"
        textToSpeak={buildSurvivalKitBroScript(
          payload.subject,
          payload.priority_topics,
          payload.pass_guarantee_checklist
        )}
      />

      {/* Panic Timeline Roadmap */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-red-600 shrink-0" />
          Prioritized Panic-Window Study Roadmap
        </h2>

        <div className="space-y-3">
          {payload.panic_timeline_roadmap.map((slot, i) => (
            <div key={i} className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900">{slot.window}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded shrink-0">
                  Action Item
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium">{slot.action}</p>
              {slot.target_topics && slot.target_topics.length > 0 && (
                <div className="pt-1.5 flex flex-wrap gap-1.5">
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
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500 shrink-0" />
          High-Yield Topics Ranked by Expected Marks
        </h2>

        <div className="space-y-4">
          {payload.priority_topics.map((top, i) => (
            <div key={i} className="p-3.5 sm:p-4 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-slate-900 text-white rounded shrink-0">
                      #{top.importance_rank || i + 1}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{top.title}</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{top.module_name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 shrink-0 self-start">
                  ~{top.expected_marks} Marks
                </span>
              </div>

              {/* Summary Points */}
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 pl-1 leading-relaxed">
                {top.summary_points.map((pt, pi) => (
                  <li key={pi}>
                    <MathText content={pt} />
                  </li>
                ))}
              </ul>

              {/* Must-Draw Diagram */}
              {top.must_draw_diagram && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded text-xs text-blue-900 overflow-x-auto max-w-full">
                  <span className="font-bold">Must-Draw Diagram: </span>
                  <MathText content={top.must_draw_diagram} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pass Guarantee Checklist */}
      {payload.pass_guarantee_checklist.length > 0 && (
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-3">
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
                  <span className="flex-1 font-medium">
                    <MathText content={item} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

