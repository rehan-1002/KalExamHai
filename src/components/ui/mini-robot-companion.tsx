"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  BookOpen,
  Lightbulb,
  ShieldCheck,
  ExternalLink,
  Flame,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface SparkParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

export function MiniRobotCompanion() {
  const pathname = usePathname();

  // Hide on auth pages for distraction-free login/signup
  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  const [isOpen, setIsOpen] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isEureka, setIsEureka] = useState(false);
  const [blink, setBlink] = useState(false);
  const [scrollTilt, setScrollTilt] = useState(0);
  const [mouseEyePos, setMouseEyePos] = useState({ x: 0, y: 0 });
  const [sparks, setSparks] = useState<SparkParticle[]>([]);

  const bulbRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Determine active page persona & mode
  const pageMode = useMemo(() => {
    if (pathname?.includes("/cram")) return "cram";
    if (pathname?.includes("/pricing")) return "pricing";
    if (pathname?.includes("/exam") || pathname?.includes("/mock") || pathname?.includes("/papers"))
      return "exam";
    return "normal";
  }, [pathname]);

  // Contextual Dynamic Tips
  const currentTips = useMemo(() => {
    switch (pageMode) {
      case "cram":
        return [
          "Emergency Mode! Focus only on high-yield Modules 3 & 4! 🔥",
          "Diagrams carry 40% marks in MU — label every single block! ✏️",
          "Bhai panic mat kar: Section 1 gives 10 guaranteed marks in 15 mins! ⚡",
          "Formulas bhool gaye? 12-Hour Survival Kit khol ke dekho! 🎯",
        ];
      case "exam":
        return [
          "10-mark question = max 18 minutes! Time management is key! ⏱️",
          "Pehle saare 2-mark aur definition questions finish kar lo! 💡",
          "Step marks matter: Even if calculation goes wrong, formula marks milega! 📝",
        ];
      case "pricing":
        return [
          "Bhai ek cutting chai aur samosa ke rate mein sem nikal jayega! 🪙",
          "Unlimited AI papers + 12-hr cram kits = 100% peace of mind! 🚀",
        ];
      default:
        return [
          "Bhai syllabus ready hai! Relax hoke target modules prepare kar! 💡",
          "Studying in bed? Snap question photos on Telegram @kalexamhai_bot 📲",
          "Only 6 hours left? Jump straight to the Panic Survival Kit! 🎯",
          "Examiner viva kal hai? Top 5 trap questions review kar lo! 🎤",
        ];
    }
  }, [pageMode]);

  const [tipIndex, setTipIndex] = useState(0);

  // Tip cycling
  useEffect(() => {
    if (bubbleDismissed || isOpen || isSleeping) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % currentTips.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [bubbleDismissed, isOpen, isSleeping, currentTips.length]);

  // 2. Natural Blink Cycle (Organic blinking every 3.5s - 5s)
  useEffect(() => {
    if (isSleeping) return;
    const triggerBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    };

    const interval = setInterval(() => {
      triggerBlink();
      // Occasional double-blink
      if (Math.random() > 0.6) {
        setTimeout(triggerBlink, 260);
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isSleeping]);

  // 3. User Activity & Sleep State Machine (Idle for 22 seconds => Sleep)
  useEffect(() => {
    const resetIdleTimer = () => {
      if (isSleeping) {
        setIsSleeping(false);
        setIsWakingUp(true);
        setTimeout(() => setIsWakingUp(false), 900);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsSleeping(true);
      }, 22000);
    };

    resetIdleTimer();

    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("scroll", resetIdleTimer);
    window.addEventListener("touchstart", resetIdleTimer);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("scroll", resetIdleTimer);
      window.removeEventListener("touchstart", resetIdleTimer);
    };
  }, [isSleeping]);

  // 4. Smooth Cursor Eye-Tracking with Polar Distance Clamp
  useEffect(() => {
    if (isSleeping) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!bulbRef.current) return;
      const rect = bulbRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);
      const angle = Math.atan2(deltaY, deltaX);

      // Max eye travel inside socket: 3.5px
      const clampedDist = Math.min(distance * 0.015, 3.5);
      const eyeX = Math.cos(angle) * clampedDist;
      const eyeY = Math.sin(angle) * clampedDist;

      setMouseEyePos({ x: eyeX, y: eyeY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isSleeping]);

  // 5. Scroll Velocity & Aerodynamic Tilt
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      // Fast downward scroll tilts backward against wind (-22deg max)
      // Fast upward scroll tilts forward (+14deg max)
      const targetTilt = Math.max(-24, Math.min(16, -delta * 0.45));
      setScrollTilt(targetTilt);

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollTilt(0); // smooth spring return
      }, 180);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // 6. Click / Poke Eureka Explosion
  const handleBulbClick = () => {
    setIsOpen(!isOpen);
    setBubbleDismissed(true);

    if (isSleeping) {
      setIsSleeping(false);
      setIsWakingUp(true);
      setTimeout(() => setIsWakingUp(false), 800);
      return;
    }

    setIsEureka(true);

    // Spawn 8 festive celebratory spark particles
    const newSparks: SparkParticle[] = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: -(Math.random() * 45 + 15),
      color: ["#F59E0B", "#FBBF24", "#38BDF8", "#34D399", "#FB7185"][i % 5],
      size: Math.random() * 3 + 2.5,
    }));
    setSparks(newSparks);

    setTimeout(() => {
      setIsEureka(false);
      setSparks([]);
    }, 1200);
  };

  if (isAuthPage) return null;

  // Active Glow Color Scheme per Mode
  const isCram = pageMode === "cram";
  const glowColor = isSleeping
    ? "rgba(245, 158, 11, 0.2)"
    : isEureka
    ? "rgba(56, 189, 248, 0.85)"
    : isCram
    ? "rgba(239, 68, 68, 0.65)"
    : isHovered
    ? "rgba(251, 191, 36, 0.75)"
    : "rgba(245, 158, 11, 0.5)";

  const filamentColor = isSleeping
    ? "#D97706"
    : isEureka
    ? "#38BDF8"
    : isCram
    ? "#EF4444"
    : "#F59E0B";

  return (
    <aside
      aria-label="Bulb-Bhai AI Wingman Companion"
      className="fixed bottom-4 left-4 z-40 select-none print:hidden pointer-events-none"
    >
      <div className="pointer-events-auto flex flex-col items-start">
        {/* 1. Speech Bubble Tip (Floating above Bulb) */}
        <AnimatePresence>
          {!isOpen && !bubbleDismissed && !isSleeping && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className={`mb-2.5 max-w-[240px] sm:max-w-[270px] bg-white border shadow-xl rounded-[12px] p-3 text-xs text-slate-800 relative ${
                isCram ? "border-amber-400 ring-2 ring-amber-300/40" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-1.5 mb-1">
                <span
                  className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider ${
                    isCram ? "text-amber-600" : "text-blue-600"
                  }`}
                >
                  {isCram ? (
                    <>
                      <Flame className="w-3 h-3 text-red-500 animate-bounce" />
                      12-Hour Panic Alert
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                      Bulb-Bhai Eureka Tip
                    </>
                  )}
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
                {currentTips[tipIndex % currentTips.length]}
              </p>

              {/* Triangle pointer pointing down to bulb */}
              <div className="absolute -bottom-1.5 left-7 w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Interactive Dialog Card (When Clicked) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="mb-3 w-[300px] sm:w-[330px] bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 text-slate-900"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-lg shadow-sm">
                    💡
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      Bulb-Bhai
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                        100W All-Nighter
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-500">Your Midnight Exam Eureka Wingman</p>
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
              <div className="mt-3 p-3 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-blue-50/40 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-amber-600" />
                    Bed Padhai on Telegram
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-600 text-white rounded-[4px]">
                    FREE
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Desk pe baithne ki himmat nahi? Bed se photo kheecho — Telegram bot 5 second mein full solution bhej dega.
                </p>
                <a
                  href="https://t.me/kalexamhai_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg shadow-sm transition-all text-center"
                >
                  <span>Open @kalexamhai_bot</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Feature 2: Quick Study Shortcuts */}
              <div className="mt-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Emergency Shortcuts
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    href="/student/cram/quick-notes"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 transition-colors text-left"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-700 truncate">
                      Formula Sheet
                    </span>
                  </Link>
                  <Link
                    href="/student/cram/survival-kit"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 transition-colors text-left"
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
                  &ldquo;Dimag ki batti jala, kal paper phod ke aana hai! 💡💪&rdquo;
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. The Animated Bulb-Bhai Companion Trigger */}
        <div ref={bulbRef} className="relative flex flex-col items-center">
          {/* Confetti / Spark Burst Particles on Eureka */}
          {sparks.map((spark) => (
            <motion.div
              key={spark.id}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
              animate={{
                opacity: 0,
                x: spark.x,
                y: spark.y,
                scale: 1,
              }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="absolute top-6 left-7 rounded-full pointer-events-none z-50 shadow-sm"
              style={{
                width: spark.size,
                height: spark.size,
                backgroundColor: spark.color,
                boxShadow: `0 0 6px ${spark.color}`,
              }}
            />
          ))}

          {/* Floating Sleep 'z Z Z' Particle */}
          <AnimatePresence>
            {isSleeping && (
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0.6 }}
                animate={{
                  opacity: [0, 0.9, 0],
                  y: -30,
                  x: [0, 6, -4, 2],
                  scale: [0.6, 1, 1.2],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-3 right-2 text-amber-500 font-extrabold text-xs pointer-events-none z-30 drop-shadow"
              >
                z Z Z
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            aria-label="Open Bulb-Bhai Exam Wingman"
            onClick={handleBulbClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{
              rotate: scrollTilt,
              scale: isEureka ? [1, 1.22, 0.92, 1.08, 1] : isWakingUp ? [1, 1.18, 0.95, 1] : 1,
            }}
            transition={{
              rotate: { type: "spring", stiffness: 280, damping: 18 },
              scale: { duration: 0.55, ease: "easeOut" },
            }}
            className="relative group cursor-pointer focus:outline-none flex flex-col items-center"
          >
            {/* Organic Floating & Breathing Bobbing Motion */}
            <motion.div
              animate={{
                y: isSleeping ? [0, -2.5, 0] : isCram ? [0, -7, 0] : [0, -5, 0],
                scale: isSleeping ? [1, 0.985, 1] : [1, 1.015, 1], // Subtle breathing expansion
              }}
              transition={{
                duration: isSleeping ? 4.2 : isCram ? 1.8 : 3.0,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              {/* Outer Ambient Glow Bloom */}
              <div
                className="absolute inset-1 rounded-full filter blur-md transition-all duration-500 pointer-events-none"
                style={{
                  background: glowColor,
                  transform: "scale(1.15)",
                }}
              />

              {/* Master Handcrafted SVG Lightbulb */}
              <svg
                width="56"
                height="68"
                viewBox="0 0 64 78"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 filter drop-shadow-lg"
              >
                <defs>
                  {/* Glass Outer Rim Reflection */}
                  <linearGradient id="glassGloss" x1="16" y1="8" x2="32" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFFFFF" stopOpacity="0.65" />
                    <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0.18" />
                    <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>

                  {/* Inner Warm Ambient Glow */}
                  <radialGradient id="innerBulbGlow" cx="32" cy="30" r="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor={filamentColor} stopOpacity={isSleeping ? "0.22" : "0.55"} />
                    <stop offset="0.65" stopColor={filamentColor} stopOpacity={isSleeping ? "0.08" : "0.18"} />
                    <stop offset="1" stopColor="#0F172A" stopOpacity="0.02" />
                  </radialGradient>

                  {/* Metallic Brass Base Gradient */}
                  <linearGradient id="brassMetallic" x1="22" y1="56" x2="42" y2="70" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F59E0B" />
                    <stop offset="0.25" stopColor="#D97706" />
                    <stop offset="0.6" stopColor="#B45309" />
                    <stop offset="0.85" stopColor="#78350F" />
                    <stop offset="1" stopColor="#B45309" />
                  </linearGradient>

                  {/* Glass Edge Stroke Gradient */}
                  <linearGradient id="glassEdge" x1="10" y1="10" x2="54" y2="56" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#CBD5E1" stopOpacity="0.9" />
                    <stop offset="0.5" stopColor="#94A3B8" stopOpacity="0.5" />
                    <stop offset="1" stopColor="#64748B" stopOpacity="0.75" />
                  </linearGradient>
                </defs>

                {/* 1. Glass Dome Envelope Base Fill */}
                <path
                  d="M 32 4 C 45 4 54 13 54 26 C 54 36 46 44 43 51 L 21 51 C 18 44 10 36 10 26 C 10 13 19 4 32 4 Z"
                  fill="url(#innerBulbGlow)"
                  stroke="url(#glassEdge)"
                  strokeWidth="1.8"
                />

                {/* 2. Realistic Curved Specular Highlight (Curved 3D Glass Reflection) */}
                <path
                  d="M 18 12 C 24 7 38 6 44 11 C 42 13 30 10 22 15 C 18 17 15 22 14 27 C 13 22 15 15 18 12 Z"
                  fill="url(#glassGloss)"
                />

                {/* Top-Right Secondary Edge Gloss */}
                <path
                  d="M 49 20 C 51 25 50 32 47 37"
                  stroke="#FFFFFF"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeOpacity="0.45"
                />

                {/* 3. Tungsten Internal Support Pillars */}
                <line x1="27" y1="51" x2="27" y2="38" stroke="#94A3B8" strokeWidth="1.1" strokeLinecap="round" />
                <line x1="37" y1="51" x2="37" y2="38" stroke="#94A3B8" strokeWidth="1.1" strokeLinecap="round" />
                <line x1="27" y1="38" x2="37" y2="38" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />

                {/* 4. The Expressive Glowing Filament Face */}
                <g style={{ filter: `drop-shadow(0 0 3px ${filamentColor})` }}>
                  {/* Eyes Logic */}
                  {isSleeping ? (
                    // Sleeping peaceful curved eyes (-.-)
                    <g stroke={filamentColor} strokeWidth="1.8" strokeLinecap="round" fill="none">
                      <path d="M 23 28 C 24 30 27 30 28 28" />
                      <path d="M 36 28 C 37 30 40 30 41 28" />
                    </g>
                  ) : isEureka ? (
                    // Starry Eureka Eyes (★_★)
                    <g fill={filamentColor}>
                      <polygon points="26,24 27.5,27.5 31,28 28,30.5 29,34 26,32 23,34 24,30.5 21,28 24.5,27.5" transform="scale(0.85) translate(4, 2)" />
                      <polygon points="40,24 41.5,27.5 45,28 42,30.5 43,34 40,32 37,34 38,30.5 35,28 38.5,27.5" transform="scale(0.85) translate(8, 2)" />
                    </g>
                  ) : isCram ? (
                    // Determined / Laser-Focus Eyes (ง'̀-'́)ง
                    <g>
                      {/* Angled Fierce Brows */}
                      <line x1="21" y1="23" x2="28" y2="25" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="43" y1="23" x2="36" y2="25" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                      {/* Focused Glowing Pupils */}
                      <motion.ellipse
                        cx={25 + mouseEyePos.x}
                        cy={28 + mouseEyePos.y}
                        rx="3"
                        ry={blink ? 0.3 : 3}
                        fill="#FFFFFF"
                      />
                      <motion.ellipse
                        cx={39 + mouseEyePos.x}
                        cy={28 + mouseEyePos.y}
                        rx="3"
                        ry={blink ? 0.3 : 3}
                        fill="#FFFFFF"
                      />
                    </g>
                  ) : (
                    // Normal Adorable Large Animated Eyes with Specular Catchlights
                    <g>
                      {/* Left Eyeball */}
                      <motion.circle
                        cx={25 + mouseEyePos.x}
                        cy={27 + mouseEyePos.y}
                        r={blink ? 0.4 : 3.8}
                        fill="#0F172A"
                        stroke={filamentColor}
                        strokeWidth="1.2"
                      />
                      {!blink && (
                        <>
                          <circle cx={24 + mouseEyePos.x} cy={25.5 + mouseEyePos.y} r="1.3" fill="#FFFFFF" />
                          <circle cx={26.8 + mouseEyePos.x} cy={28 + mouseEyePos.y} r="0.6" fill="#FFFFFF" />
                        </>
                      )}

                      {/* Right Eyeball */}
                      <motion.circle
                        cx={39 + mouseEyePos.x}
                        cy={27 + mouseEyePos.y}
                        r={blink ? 0.4 : 3.8}
                        fill="#0F172A"
                        stroke={filamentColor}
                        strokeWidth="1.2"
                      />
                      {!blink && (
                        <>
                          <circle cx={38 + mouseEyePos.x} cy={25.5 + mouseEyePos.y} r="1.3" fill="#FFFFFF" />
                          <circle cx={40.8 + mouseEyePos.x} cy={28 + mouseEyePos.y} r="0.6" fill="#FFFFFF" />
                        </>
                      )}
                    </g>
                  )}

                  {/* Cute Mouth Expression */}
                  {isSleeping ? (
                    // Tiny sleepy breathing mouth
                    <circle cx="32" cy="33" r="1.1" fill={filamentColor} />
                  ) : isEureka ? (
                    // Big wide joyful open mouth
                    <path d="M 28 32 Q 32 37 36 32 Z" fill={filamentColor} />
                  ) : isCram ? (
                    // Determined grit smile
                    <path
                      d="M 28 33 Q 32 35 36 33"
                      stroke="#FFFFFF"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      fill="none"
                    />
                  ) : (
                    // Sweet curved friendly smile
                    <path
                      d={isHovered ? "M 27 32 Q 32 37 37 32" : "M 28 32.5 Q 32 35.5 36 32.5"}
                      stroke={filamentColor}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  )}
                </g>

                {/* 5. CRAM MODE ONLY: Red 'Kal Exam Hai' Headband with Fluttering Tails */}
                {isCram && (
                  <g>
                    {/* Headband Cloth Wrap across forehead */}
                    <path
                      d="M 12 18 Q 32 14 52 18 L 51 22 Q 32 18 13 22 Z"
                      fill="#EF4444"
                      stroke="#B91C1C"
                      strokeWidth="0.8"
                    />
                    {/* Golden Center Flame Emblem */}
                    <polygon points="32,15 33.5,18 35,17 33.5,21 32,20 30.5,21 29,17 30.5,18" fill="#FBBF24" />

                    {/* Left fluttering ribbon tail */}
                    <motion.path
                      d="M 13 20 Q 7 24 3 22 Q 6 28 12 22 Z"
                      fill="#EF4444"
                      animate={{
                        d: [
                          "M 13 20 Q 7 24 3 22 Q 6 28 12 22 Z",
                          "M 13 20 Q 5 18 2 24 Q 7 26 12 22 Z",
                          "M 13 20 Q 7 24 3 22 Q 6 28 12 22 Z",
                        ],
                      }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </g>
                )}

                {/* 6. Realistic Metallic Brass Screw Base */}
                <g>
                  {/* Brass Thread 1 */}
                  <rect x="22" y="51" width="20" height="4" rx="2" fill="url(#brassMetallic)" stroke="#78350F" strokeWidth="0.5" />
                  {/* Brass Thread 2 */}
                  <rect x="23" y="55" width="18" height="4" rx="2" fill="url(#brassMetallic)" stroke="#78350F" strokeWidth="0.5" />
                  {/* Brass Thread 3 */}
                  <rect x="24" y="59" width="16" height="4" rx="2" fill="url(#brassMetallic)" stroke="#78350F" strokeWidth="0.5" />
                  {/* Black Insulating Base Contact */}
                  <path d="M 26 63 Q 32 67 38 63 L 36 65 Q 32 68 28 65 Z" fill="#1E293B" />
                  {/* Under-Thruster Glowing Ring */}
                  <ellipse
                    cx="32"
                    cy="66"
                    rx="4.5"
                    ry="1.5"
                    fill={isCram ? "#EF4444" : "#38BDF8"}
                    className={isCram ? "animate-pulse" : ""}
                  />
                </g>
              </svg>
            </motion.div>

            {/* Dynamic Interactive Ground Shadow */}
            <motion.div
              animate={{
                scale: isSleeping ? [1, 0.9, 1] : [1, 0.72, 1],
                opacity: isSleeping ? [0.25, 0.2, 0.25] : [0.35, 0.18, 0.35],
              }}
              transition={{
                duration: isSleeping ? 4.2 : isCram ? 1.8 : 3.0,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-8 h-1.5 bg-slate-500 rounded-[50%] mt-1 filter blur-[1px]"
            />
          </motion.button>
        </div>
      </div>
    </aside>
  );
}

export default MiniRobotCompanion;
