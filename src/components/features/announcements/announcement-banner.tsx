"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";
import type { AnnouncementConfig } from "@/server/announcements/store";

interface AnnouncementBannerProps {
  announcement: AnnouncementConfig;
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const getDismissKey = (cfg: AnnouncementConfig) => {
    const textHash = (cfg.text || "").slice(0, 20).replace(/[^a-zA-Z0-9]/g, "");
    return `keh_dismiss_${cfg.updatedAt}_${textHash}`;
  };

  useEffect(() => {
    setMounted(true);
    if (!announcement?.active) {
      setIsDismissed(true);
      return;
    }
    const dismissedKey = getDismissKey(announcement);
    const dismissed = sessionStorage.getItem(dismissedKey);
    setIsDismissed(Boolean(dismissed));
  }, [announcement?.active, announcement?.updatedAt, announcement?.text]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (announcement) {
      const dismissedKey = getDismissKey(announcement);
      sessionStorage.setItem(dismissedKey, "true");
    }
  };

  if (!announcement?.active || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white px-3 sm:px-4 py-2 text-xs shadow-sm transition-all print:hidden select-none relative z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
        {/* Left Badge */}
        <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-[4px] bg-white/20 text-white shrink-0 flex items-center gap-1 shadow-xs">
          <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
          <span>{announcement.badge || "ANNOUNCEMENT"}</span>
        </span>

        {/* Marquee Content */}
        <div className="overflow-hidden relative flex-1 min-w-0 mx-1 group py-0.5">
          <div className="inline-flex items-center animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused] cursor-default">
            {/* Instance 1 */}
            <span className="font-semibold text-blue-50 text-xs sm:text-[13px] tracking-wide">
              {announcement.text}
            </span>
            {announcement.link && (
              <Link
                href={announcement.link}
                className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 ml-2.5 text-xs shrink-0 cursor-pointer"
              >
                <span>Check Now</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}

            {/* Separator */}
            <span className="mx-8 text-white/30 font-light">•</span>

            {/* Instance 2 (for seamless infinite loop) */}
            <span className="font-semibold text-blue-50 text-xs sm:text-[13px] tracking-wide">
              {announcement.text}
            </span>
            {announcement.link && (
              <Link
                href={announcement.link}
                className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 ml-2.5 text-xs shrink-0 cursor-pointer"
              >
                <span>Check Now</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}

            {/* Separator */}
            <span className="mx-8 text-white/30 font-light">•</span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/10 rounded-[4px] text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
          title="Dismiss Banner"
          aria-label="Dismiss announcement banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

