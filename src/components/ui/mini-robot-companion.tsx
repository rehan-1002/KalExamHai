"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  BookOpen,
  Lightbulb,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const EXAM_TIPS = [
  "Bhai diagrams carry 40% marks in MU — always draw neat labeled boxes! ✏️",
  "Studying in bed? Snap question photos with our Telegram bot @kalexamhai_bot 📲",
  "Panic mat kar: Section 1 gives 10 guaranteed marks in under 15 minutes! ⚡",
  "Formulas bhool gaye? Check your High-Yield Formula Cheat Sheet! 📑",
  "Examiner viva kal hai? Review the 5 most frequent examiner trap questions! 🎤",
  "Only 6 hours left? Jump straight to the 12-Hour Panic Survival Kit! 🎯",
];

export function MiniRobotCompanion() {
  const pathname = usePathname();

  // Hide on auth pages for distraction-free login/signup
  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  const [isOpen, setIsOpen] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Cycle tips every 12 seconds if the bubble isn't dismissed
  useEffect(() => {
    if (bubbleDismissed || isOpen) return;
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % EXAM_TIPS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [bubbleDismissed, isOpen]);

  if (isAuthPage) return null;

  return (
    <aside aria-label="Mini Robot Companion" className="fixed bottom-4 left-4 z-40 select-none">
      {/* 1. Speech Bubble Tip (Floating above robot) */}
      <AnimatePresence>
        {!isOpen && !bubbleDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-2.5 max-w-[240px] sm:max-w-[270px] bg-white border border-slate-200 shadow-lg rounded-[10px] p-3 text-xs text-slate-800 relative"
          >
            <div className="flex items-start justify-between gap-1.5 mb-1">
              <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider text-blue-600">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Exam Wingman Tip
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBubbleDismissed(true);
                }}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                title="Dismiss tip"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11.5px] leading-snug text-slate-700 font-medium">
              {EXAM_TIPS[currentTipIndex]}
            </p>

            {/* Triangle pointer pointing down to robot */}
            <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Interactive Dialog Card (When Clicked) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mb-3 w-[300px] sm:w-[330px] bg-white border border-slate-200 shadow-2xl rounded-xl p-4 text-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-blue-50 border border-blue-200 flex items-center justify-center text-base">
                  🤖
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Bot-Bhai
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-500">Your All-Nighter Exam Wingman</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feature 1: Telegram Bot Card */}
            <div className="mt-3 p-3 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-200/80 rounded-[10px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  Study in Bed on Telegram
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded-[4px]">
                  100% FREE
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Too tired to sit at your desk? Snap a photo of any tough question from bed — our bot solves it in 5 seconds.
              </p>
              <a
                href="https://t.me/kalexamhai_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-[6px] shadow-sm transition-colors text-center"
              >
                <span>Open @kalexamhai_bot</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Feature 2: Quick Study Shortcuts */}
            <div className="mt-3 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Last-Minute Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <Link
                  href="/student/cram/quick-notes"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-[8px] border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors text-left"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-700 truncate">
                    Formula Sheet
                  </span>
                </Link>
                <Link
                  href="/student/cram/survival-kit"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-[8px] border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors text-left"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-700 truncate">
                    Survival Kit
                  </span>
                </Link>
              </div>
            </div>

            {/* Motivational Footer */}
            <div className="mt-3 pt-2 border-t border-slate-100 text-center">
              <p className="text-[10.5px] font-semibold text-slate-500 italic">
                &ldquo;Kal Exam Hai, lekin tu phodega! 💪&rdquo;
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. The Animated Mini Robot Trigger */}
      <motion.button
        type="button"
        aria-label="Open Exam Wingman Assistant"
        onClick={() => {
          setIsOpen(!isOpen);
          setBubbleDismissed(true);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group cursor-pointer focus:outline-none flex flex-col items-center"
      >
        {/* Floating Robot Body */}
        <motion.div
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          {/* Custom SVG Mini Robot */}
          <svg
            width="52"
            height="56"
            viewBox="0 0 52 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-md"
          >
            {/* Graduation Cap on top */}
            <g transform="translate(6, 0)">
              {/* Cap diamond */}
              <polygon points="20,0 38,6 20,12 2,6" fill="#1E293B" stroke="#0F172A" strokeWidth="0.8" />
              {/* Cap under-rim */}
              <path d="M9 7.5V11C9 14 31 14 31 11V7.5" fill="#334155" />
              {/* Gold Tassel */}
              <line x1="20" y1="6" x2="6" y2="10" stroke="#F59E0B" strokeWidth="1.2" />
              <circle cx="6" cy="11.5" r="1.5" fill="#F59E0B" />
            </g>

            {/* Antenna with Pulsing Glowing Orb */}
            <line x1="26" y1="12" x2="26" y2="18" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" />
            <circle
              cx="26"
              cy="11"
              r="3"
              fill={isHovered ? "#38BDF8" : "#2563EB"}
              className="animate-pulse"
            />

            {/* Robot Head Outer Frame */}
            <rect
              x="8"
              y="18"
              width="36"
              height="24"
              rx="6"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="1.8"
            />

            {/* Digital Visor / Screen */}
            <rect
              x="12"
              y="22"
              width="28"
              height="16"
              rx="3.5"
              fill="#0F172A"
            />

            {/* Expressive Robot Eyes */}
            {isHovered ? (
              // Happy winking / cheerful eyes on hover
              <>
                <path d="M17 30C17 28 21 28 21 30" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M31 30C31 28 35 28 35 30" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              // Normal attentive eyes
              <>
                <rect x="17" y="27" width="4.5" height="5.5" rx="1.5" fill="#38BDF8" />
                <rect x="30.5" y="27" width="4.5" height="5.5" rx="1.5" fill="#38BDF8" />
              </>
            )}

            {/* Subtle smiling mouth */}
            <path
              d="M23 35.5C24.5 36.5 27.5 36.5 29 35.5"
              stroke="#38BDF8"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Robot Body Chassis */}
            <rect
              x="14"
              y="43"
              width="24"
              height="11"
              rx="3"
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />

            {/* Chest Energy Meter (3 glowing LED notches) */}
            <rect x="18" y="46.5" width="3" height="4" rx="0.8" fill="#10B981" />
            <rect x="24.5" y="46.5" width="3" height="4" rx="0.8" fill="#10B981" />
            <rect x="31" y="46.5" width="3" height="4" rx="0.8" fill="#10B981" />
          </svg>
        </motion.div>

        {/* Dynamic Shadow underneath the floating robot */}
        <motion.div
          animate={{
            scale: [1, 0.75, 1],
            opacity: [0.35, 0.2, 0.35],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-7 h-1.5 bg-slate-400 rounded-[50%] mt-0.5 filter blur-[1px]"
        />
      </motion.button>
    </aside>
  );
}

export default MiniRobotCompanion;
