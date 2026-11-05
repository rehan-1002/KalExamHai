"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { LiquidGlassCanvas } from "./liquid-glass-webgl";

/**
 * KalExamHai Symmetrical Centered Hero
 * - Perfectly centered in both horizontal and vertical axes
 * - Larger WebGL liquid glass KEH monogram
 * - Exactly one sentence of copy
 * - Two symmetric rectangular tabs: "Sign in as Student" & "Sign in as Tutor"
 * - No pills, no distracting hover animations, clean & responsive
 */
export function LiquidGlassReveal() {
  const [isRevealed, setIsRevealed] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  // Guarantee light theme on landing page
  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const handleRevealComplete = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const handleReplay = useCallback(() => {
    setIsRevealed(false);
    setReplayKey((k) => k + 1);
  }, []);

  const handleSkip = useCallback(() => {
    setIsRevealed(true);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#F9F9F6] text-[#1F2937] selection:bg-[#EFF6FF] selection:text-[#2563EB] px-4 sm:px-6 py-8 overflow-hidden">
      {/* Absolute Corner Controls (Does not disrupt vertical center) */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-8 z-30">
        {!isRevealed ? (
          <button
            onClick={handleSkip}
            className="text-xs text-[#6B7280] hover:text-[#1F2937] hover:bg-black/[0.04] transition-all duration-150 font-medium px-2.5 py-1.5 rounded-md cursor-pointer"
          >
            Skip &rarr;
          </button>
        ) : (
          <button
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#1F2937] hover:bg-black/[0.04] active:scale-[0.97] transition-all duration-150 font-medium px-2.5 py-1.5 rounded-md cursor-pointer"
            title="Replay Liquid Glass"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay</span>
          </button>
        )}
      </div>

      {/* Main Symmetrical Centerpiece */}
      <main className="w-full max-w-lg mx-auto flex flex-col items-center justify-center text-center">
        {/* 1. Liquid Glass Logo Reveal (Larger, perfectly centered, stays anchored) */}
        <div className="w-full max-w-[360px] sm:max-w-[420px] h-[230px] sm:h-[270px] flex items-center justify-center relative select-none mx-auto">
          <LiquidGlassCanvas
            key={replayKey}
            onComplete={handleRevealComplete}
            isPlaying={true}
          />
        </div>

        {/* 2. Content below Logo (Appears smoothly once rippled or on skip) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isRevealed ? 1 : 0,
            y: isRevealed ? 0 : 10,
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full flex flex-col items-center text-center mt-2 sm:mt-3 ${
            !isRevealed ? "pointer-events-none" : ""
          }`}
        >
          {/* Brand Title */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2937]">
            KalExamHai
          </h1>

          {/* Single Line Description */}
          <p className="mt-2 text-sm sm:text-base text-[#4B5563] max-w-sm sm:max-w-md font-normal leading-relaxed">
            Turn your notes into tomorrow&apos;s exam paper.
          </p>

          {/* Two Symmetric Tabs / Action Buttons (Equal width & height, no pills) */}
          <div className="mt-6 sm:mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-xs sm:max-w-md mx-auto">
            {/* Student Tab */}
            <Link
              href="/login?role=student"
              className="h-11 sm:h-12 w-full inline-flex items-center justify-center rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm border border-[#2563EB] hover:border-[#1D4ED8] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              Sign in as Student
            </Link>

            {/* Tutor Tab */}
            <Link
              href="/login?role=tutor"
              className="h-11 sm:h-12 w-full inline-flex items-center justify-center rounded-lg bg-white hover:bg-[#FAFAFA] text-[#1F2937] hover:text-black font-medium text-sm border border-[#D1D5DB] hover:border-[#9CA3AF] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              Sign in as Tutor
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Symmetrical Bottom Navigation & Legal */}
      <footer className="absolute bottom-3 sm:bottom-5 inset-x-0 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[11px] text-[#9CA3AF] px-4 z-20">
        <span>Mumbai University NEP-2020</span>
        <span className="hidden sm:inline">&bull;</span>
        <Link href="/terms" className="hover:text-slate-700 transition-colors pointer-events-auto">
          Terms
        </Link>
        <span className="hidden sm:inline">&bull;</span>
        <Link href="/privacy" className="hover:text-slate-700 transition-colors pointer-events-auto">
          Privacy
        </Link>
        <span className="hidden sm:inline">&bull;</span>
        <Link href="/refund-policy" className="hover:text-slate-700 transition-colors pointer-events-auto">
          Refund Policy
        </Link>
        <span className="hidden sm:inline">&bull;</span>
        <Link href="/contact" className="hover:text-slate-700 transition-colors pointer-events-auto">
          Contact
        </Link>
      </footer>
    </div>
  );
}
