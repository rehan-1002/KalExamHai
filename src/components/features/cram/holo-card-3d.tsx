"use client";

import React, { useState, useEffect, useRef, MouseEvent } from "react";
import { Sparkles, RotateCw, Lightbulb, Smartphone } from "lucide-react";
import { MathText } from "@/components/ui/math-text";
import type { FlashcardItem } from "@/lib/schemas/cram";

interface HoloCard3DProps {
  card: FlashcardItem;
  isFlipped: boolean;
  onFlip: () => void;
}

export function HoloCard3D({ card, isFlipped, onFlip }: HoloCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [hasGyro, setHasGyro] = useState(false);

  // 1. Gyroscope Motion (Device Orientation for Mobile / Tablet Tilt)
  useEffect(() => {
    let gyroActive = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      if (!gyroActive) {
        gyroActive = true;
        setHasGyro(true);
      }

      // Normal phone holding angle: beta ~ 45deg, gamma ~ 0deg
      const naturalBeta = 45;
      const deltaBeta = e.beta - naturalBeta;
      const deltaGamma = e.gamma;

      // Constrain tilt to +/- 14 degrees for realistic physics feel
      const rX = Math.max(-14, Math.min(14, deltaBeta * -0.5));
      const rY = Math.max(-14, Math.min(14, deltaGamma * 0.5));

      setRotateX(rX);
      setRotateY(rY);

      // Dynamically move the iridescent holographic sheen across the card
      const glareX = Math.max(10, Math.min(90, 50 + (deltaGamma / 30) * 40));
      const glareY = Math.max(10, Math.min(90, 50 + (deltaBeta / 30) * 40));
      setGlarePos({ x: glareX, y: glareY, opacity: 0.38 });
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // Request iOS Safari Gyroscope permission on user interaction
  const requestIosPermission = async () => {
    const DeviceOrientation = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof DeviceOrientation?.requestPermission === "function") {
      try {
        await DeviceOrientation.requestPermission();
      } catch {
        // safely ignore
      }
    }
  };

  const handleCardClick = () => {
    requestIosPermission();
    onFlip();
  };

  // 2. Mouse Move Tilt (for Desktop / Laptop users)
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12;
    const rY = ((x - centerX) / centerX) * 12;

    setRotateX(rX);
    setRotateY(rY);

    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    if (!hasGyro) {
      setRotateX(0);
      setRotateY(0);
      setGlarePos((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  return (
    <div
      className="w-full max-w-xl mx-auto h-[380px] sm:h-[420px] select-none cursor-pointer"
      style={{ perspective: "1200px" }}
      onClick={handleCardClick}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-full transition-transform duration-300 ease-out preserve-3d"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY + (isFlipped ? 180 : 0)}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* ============================================================ */}
        {/* FRONT FACE                                                   */}
        {/* ============================================================ */}
        <div
          className="absolute inset-0 w-full h-full bg-white border-2 border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-lg backface-hidden overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Holographic Iridescent Ambient Sheen */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              opacity: glarePos.opacity,
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(37, 99, 235, 0.28), rgba(168, 85, 247, 0.22), transparent 70%)`,
            }}
          />

          {/* Top Bar: Category & Importance */}
          <div className="flex items-center justify-between gap-2 z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-[6px]">
              {card.category}
            </span>

            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[6px] border ${
                card.importance === "must_know"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : card.importance === "high_yield"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {card.importance === "must_know"
                ? "Must Know 🔥"
                : card.importance === "high_yield"
                ? "High Yield ⚡"
                : "Bonus Concept"}
            </span>
          </div>

          {/* Center: Question / Prompt with KaTeX */}
          <div className="my-auto py-4 text-center z-10">
            <div className="text-lg sm:text-xl font-medium text-slate-900 leading-relaxed">
              <MathText content={card.front} />
            </div>

            {card.hint && (
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-[6px]">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Hint: {card.hint}</span>
              </div>
            )}
          </div>

          {/* Bottom Flip / Gyro Indicator */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium z-10">
            <RotateCw className="w-3.5 h-3.5" />
            <span>
              {hasGyro
                ? "Tilt device for 3D depth • Tap to flip"
                : "Tap or click to flip (Spacebar on desktop)"}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BACK FACE                                                    */}
        {/* ============================================================ */}
        <div
          className="absolute inset-0 w-full h-full bg-[#0F172A] border-2 border-blue-500/40 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl backface-hidden overflow-hidden text-white"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Holographic Iridescent Accent Glow for Dark Mode */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              opacity: glarePos.opacity,
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(59, 130, 246, 0.4), rgba(147, 51, 234, 0.3), transparent 70%)`,
            }}
          />

          {/* Top Bar */}
          <div className="flex items-center justify-between gap-2 z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-blue-900/60 text-blue-300 border border-blue-700/50 rounded-[6px]">
              Verified Solution / Breakdown
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NEP-2020 Context</span>
            </div>
          </div>

          {/* Center: Answer Breakdown with KaTeX */}
          <div className="my-auto py-4 text-left z-10 overflow-y-auto max-h-[240px] pr-1">
            <div className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal">
              <MathText content={card.back} />
            </div>
          </div>

          {/* Bottom Prompt */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800 z-10">
            <span>Did you get this right?</span>
            <span className="text-blue-400 font-medium">Use buttons below</span>
          </div>
        </div>
      </div>
    </div>
  );
}

