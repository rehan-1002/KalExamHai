"use client";

import React, { useState, useTransition } from "react";
import { BellRing, Send, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { broadcastWebPushAction } from "@/app/admin/actions";

interface WebPushCardProps {
  subscriptionCount: number;
}

export function WebPushCard({ subscriptionCount }: WebPushCardProps) {
  const [title, setTitle] = useState("🚨 Tomorrow's Exam Alert!");
  const [body, setBody] = useState("Maths-1 predicted high-probability questions are now live. Revise now!");
  const [url, setUrl] = useState("/student/cram/new?type=kt_buster");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setStatusMessage(null);
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("body", body.trim());
    fd.append("url", url.trim());

    startTransition(async () => {
      try {
        const res = await broadcastWebPushAction(fd);
        if (res.ok && "sent" in res) {
          setStatusMessage(`✅ Web push delivered to ${res.sent}/${res.total} subscribed devices!`);
          setTimeout(() => setStatusMessage(null), 4000);
        } else {
          setStatusMessage(`❌ Error: ${res.error}`);
        }
      } catch {
        setStatusMessage("❌ Network error sending push notification.");
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#E7E5E0] shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E5E0]">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-emerald-600 animate-bounce" />
          <div>
            <h3 className="text-sm font-semibold text-[#1F2937]">
              Lockscreen Web Push Broadcast ({subscriptionCount} Devices Subscribed)
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Pushes a vibrating notification directly to students&apos; phones even when the browser is closed.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-[6px] border border-emerald-200 self-start sm:self-auto">
          PWA Push Active
        </span>
      </div>

      <form onSubmit={handleSend} className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Notification Title</label>
            <input
              type="text"
              required
              value={title}
              disabled={isPending}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🚨 Applied Maths-1 Alert"
              className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Tap Redirect URL</label>
            <input
              type="text"
              value={url}
              disabled={isPending}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. /student/cram/new?type=kt_buster"
              className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Notification Message</label>
          <input
            type="text"
            required
            value={body}
            disabled={isPending}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g. These 6 repeat questions have 90% chance of appearing in Q1 & Q2!"
            className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] outline-none focus:border-[#2563EB]"
          />
        </div>

        {statusMessage && (
          <div className="text-xs font-medium text-slate-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !title.trim() || !body.trim() || subscriptionCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isPending ? "Sending Push..." : "Send Lockscreen Push to All"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
