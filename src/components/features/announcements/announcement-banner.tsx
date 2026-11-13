"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";
import type { AnnouncementConfig } from "@/server/announcements/store";

interface AnnouncementBannerProps {
  announcement: AnnouncementConfig;
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (!announcement.active) {
      setIsDismissed(true);
      return;
    }
    const dismissedKey = `keh_banner_dismiss_${announcement.updatedAt}`;
    const dismissed = sessionStorage.getItem(dismissedKey);
    setIsDismissed(Boolean(dismissed));
  }, [announcement.active, announcement.updatedAt]);

  const handleDismiss = () => {
    setIsDismissed(true);
    const dismissedKey = `keh_banner_dismiss_${announcement.updatedAt}`;
    sessionStorage.setItem(dismissedKey, "true");
  };

  if (!announcement.active || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white px-4 py-2.5 text-xs shadow-sm transition-all print:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-[4px] bg-white/20 text-white shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            {announcement.badge || "ANNOUNCEMENT"}
          </span>
          <span className="font-medium truncate text-blue-50">
            {announcement.text}
          </span>
          {announcement.link && (
            <Link
              href={announcement.link}
              className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 shrink-0 ml-1 text-[11px]"
            >
              <span>Explore</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/10 rounded-[4px] text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

