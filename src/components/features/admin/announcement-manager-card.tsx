"use client";

import React, { useState, useTransition } from "react";
import { Sparkles, Save, CheckCircle2, Loader2 } from "lucide-react";
import type { AnnouncementConfig } from "@/server/announcements/store";
import { updateAnnouncementAction } from "@/app/admin/actions";

interface AnnouncementManagerCardProps {
  announcement: AnnouncementConfig;
}

export function AnnouncementManagerCard({ announcement }: AnnouncementManagerCardProps) {
  const [active, setActive] = useState(announcement.active);
  const [text, setText] = useState(announcement.text);
  const [badge, setBadge] = useState(announcement.badge || "📢 ANNOUNCEMENT");
  const [link, setLink] = useState(announcement.link || "");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const fd = new FormData();
    fd.append("active", active ? "true" : "false");
    fd.append("text", text);
    fd.append("badge", badge);
    fd.append("link", link);

    startTransition(async () => {
      try {
        const res = await updateAnnouncementAction(fd);
        if (res.ok) {
          setStatus("✅ Announcement updated and live on student dashboard!");
          setTimeout(() => setStatus(null), 3000);
        } else {
          setStatus("❌ Failed to update announcement.");
        }
      } catch {
        setStatus("❌ Network error.");
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#E7E5E0] shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-[#1F2937]">
            Global Announcement Banner Controller
          </h3>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className={active ? "text-emerald-700" : "text-slate-400"}>
            {active ? "Banner Active (Live)" : "Banner Hidden"}
          </span>
        </label>
      </div>

      <form onSubmit={handleSave} className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Badge Tag</label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g. 🔥 NEW UPDATE"
              className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] outline-none focus:border-[#2563EB]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Link URL (Optional)</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. /student/cram/new?type=kt_buster"
              className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Banner Announcement Text</label>
          <input
            type="text"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Mumbai University Dec 2024 repeat papers added to Applied Mathematics-1!"
            className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] outline-none focus:border-[#2563EB]"
          />
        </div>

        {status && (
          <div className="text-xs font-medium text-slate-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{status}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save &amp; Publish Banner</span>
          </button>
        </div>
      </form>
    </div>
  );
}
