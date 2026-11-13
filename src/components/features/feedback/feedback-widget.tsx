"use client";

import React, { useState, useTransition } from "react";
import { MessageSquarePlus, X, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { submitFeedbackAction } from "@/app/actions/feedback";
import type { FeedbackCategory } from "@/server/feedback/store";

interface FeedbackWidgetProps {
  userEmail?: string;
  userName?: string;
}

export function FeedbackWidget({ userEmail, userName }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [message, setMessage] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const res = await submitFeedbackAction({
          category,
          message,
          pageUrl: typeof window !== "undefined" ? window.location.pathname : "/",
          deviceInfo: typeof navigator !== "undefined"
            ? `${/Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop"} (${navigator.userAgent.slice(0, 50)})`
            : "Unknown",
        });

        if (res.ok) {
          setIsSent(true);
          setMessage("");
          setTimeout(() => {
            setIsSent(false);
            setIsOpen(false);
          }, 2400);
        } else {
          setErrorMessage(res.error || "Failed to submit. Please try again.");
        }
      } catch {
        setErrorMessage("Network error. Please try again.");
      }
    });
  };

  return (
    <>
      {/* Floating Action Pill */}
      <div className="fixed bottom-5 right-5 z-50 print:hidden">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-lg hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-700/50"
            title="Send Feedback or Report Bug"
          >
            <MessageSquarePlus className="w-4 h-4 text-blue-400" />
            <span>Feedback</span>
          </button>
        )}
      </div>

      {/* Slide-in Popover Form */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-200 print:hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold tracking-tight">Founder Direct Feedback</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-[5px] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {isSent ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-slate-900">Message Delivered!</h4>
                <p className="text-xs text-slate-500">
                  Thanks {userName || "bhai"}! The founder has received your feedback.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="text-[11px] text-slate-500">
                  Signed in as: <strong className="text-slate-800">{userEmail || "Student Guest"}</strong>
                </div>

                {/* Category Pills */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      { id: "suggestion" as const, label: "💡 Suggestion" },
                      { id: "bug" as const, label: "🐛 Bug / Error" },
                      { id: "syllabus" as const, label: "📚 Need Subject" },
                      { id: "general" as const, label: "⭐ General" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={`py-1.5 px-2 rounded-[6px] text-left font-medium transition-all cursor-pointer border ${
                          category === c.id
                            ? "bg-blue-50 border-blue-600 text-blue-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Your Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={message}
                    disabled={isPending}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Bhai Maths-1 ka Unit 3 PYQ missing hai ya button mein issue hai..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                  />
                </div>

                {errorMessage && (
                  <div className="text-[11px] text-red-600 flex items-center gap-1.5 bg-red-50 p-2 rounded-[6px] border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Auto-attaches current page &amp; device
                  </span>
                  <button
                    type="submit"
                    disabled={isPending || !message.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-[8px] shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
