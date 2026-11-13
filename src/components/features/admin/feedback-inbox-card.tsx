"use client";

import React, { useTransition } from "react";
import { MessageSquare, Check, ExternalLink, Smartphone, Monitor } from "lucide-react";
import type { StudentFeedback } from "@/server/feedback/store";
import { resolveFeedbackAction } from "@/app/admin/actions";

interface FeedbackInboxCardProps {
  feedbacks: StudentFeedback[];
}

export function FeedbackInboxCard({ feedbacks }: FeedbackInboxCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleResolve = (id: string) => {
    startTransition(async () => {
      await resolveFeedbackAction(id);
    });
  };

  const pendingFeedbacks = feedbacks.filter((f) => f.status === "new");
  const resolvedFeedbacks = feedbacks.filter((f) => f.status === "resolved");

  return (
    <div className="bg-white rounded-xl border border-[#E7E5E0] shadow-sm overflow-hidden p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-[#1F2937]">
            Student Direct Feedback Inbox ({pendingFeedbacks.length} Unresolved)
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          Total Received: {feedbacks.length}
        </span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {feedbacks.length > 0 ? (
          feedbacks.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                item.status === "resolved"
                  ? "bg-slate-50/70 border-slate-200 opacity-60"
                  : item.category === "bug"
                  ? "bg-red-50/50 border-red-200"
                  : "bg-purple-50/40 border-purple-200"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold uppercase ${
                      item.category === "bug"
                        ? "bg-red-100 text-red-800"
                        : item.category === "suggestion"
                        ? "bg-blue-100 text-blue-800"
                        : item.category === "syllabus"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {item.category}
                  </span>
                  <span className="font-semibold text-slate-900">{item.userName}</span>
                  <span className="text-slate-500 font-mono text-[11px]">({item.userEmail})</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString()} at{" "}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {item.status === "new" ? (
                    <button
                      disabled={isPending}
                      onClick={() => handleResolve(item.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] bg-white border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-slate-600 font-medium transition-colors cursor-pointer text-[11px]"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Resolved
                    </span>
                  )}
                </div>
              </div>

              <p className="text-slate-800 leading-relaxed font-medium bg-white/70 p-2.5 rounded-[6px] border border-black/5">
                {item.message}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-black/5">
                <span className="flex items-center gap-1">
                  Page: <strong className="font-mono text-slate-700">{item.pageUrl}</strong>
                </span>
                <span className="flex items-center gap-1">
                  {item.deviceInfo.includes("Mobile") ? (
                    <Smartphone className="w-3 h-3 text-slate-400" />
                  ) : (
                    <Monitor className="w-3 h-3 text-slate-400" />
                  )}
                  <span>{item.deviceInfo}</span>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No feedback submitted yet. Student feedback will show up here live!
          </div>
        )}
      </div>
    </div>
  );
}

