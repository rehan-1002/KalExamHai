"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Headphones,
  Sparkles,
  Loader2,
} from "lucide-react";

interface AudioRecapPlayerProps {
  title?: string;
  subject?: string;
  rawContent?: string;
  textToSpeak?: string;
  autoPlay?: boolean;
  className?: string;
}

/**
 * Strips raw LaTeX formulas, dashes, ASCII banners, and markdown gibberish.
 */
function cleanTextForSpeech(text: string): string {
  if (!text) return "";

  return text
    // Remove horizontal rules, dividers, and dashes (e.g. ------ )
    .replace(/[-=_*~]{2,}/g, " ")
    // Remove markdown headers
    .replace(/#{1,6}\s+/g, "")
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown bold/italics/links
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove table pipes, bullets, and LaTeX blocks
    .replace(/\|/g, " ")
    .replace(/[•\u2022\u2023\u25E6\u2043\u2219]/g, " ")
    .replace(/\\\[[\s\S]*?\\\]/g, " ")
    .replace(/\\\([\s\S]*?\\\)/g, " ")
    .replace(/\$[^$]*\$/g, " ")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 divided by $2")
    .replace(/[\^_{}\\]/g, " ")
    // Remove common ASCII banners
    .replace(/HIGH-YIELD FORMULA & CHEAT SHEET/gi, "Important formula sheet")
    .replace(/UNIVERSITY OF MUMBAI/gi, "Mumbai University")
    // Clean whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits text into small chunks (<160 chars) to prevent Chrome's known speechSynthesis freeze bug.
 */
function splitIntoSentences(text: string): string[] {
  const rawSentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks: string[] = [];

  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if (trimmed.length < 160) {
      chunks.push(trimmed);
    } else {
      const subParts = trimmed.split(/[,;:]+/);
      let current = "";
      for (const part of subParts) {
        if ((current + " " + part).length < 160) {
          current = current ? `${current}, ${part}` : part;
        } else {
          if (current) chunks.push(current.trim());
          current = part;
        }
      }
      if (current) chunks.push(current.trim());
    }
  }

  return chunks.filter((c) => c.length > 0);
}

export function AudioRecapPlayer({
  title = "Suno Bhai! Senior Audio Recap",
  subject,
  rawContent,
  textToSpeak,
  autoPlay = false,
  className = "",
}: AudioRecapPlayerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rate, setRate] = useState<number>(1.25); // Default 1.25x for college revision
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [sentences, setSentences] = useState<string[]>([]);
  const [scriptReady, setScriptReady] = useState(false);

  const sentencesRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const rateRef = useRef(1.25);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
      window.speechSynthesis.getVoices();
      const onVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoices);

      // If initial text is provided and no rawContent, prepare it
      if (textToSpeak && !rawContent) {
        const cleaned = cleanTextForSpeech(textToSpeak);
        const chunks = splitIntoSentences(cleaned);
        setSentences(chunks);
        sentencesRef.current = chunks;
        setScriptReady(true);
      }

      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      };
    }
  }, [textToSpeak, rawContent]);

  const speakChunk = (idx: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (idx >= sentencesRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      isPlayingRef.current = false;
      setCurrentSentenceIdx(0);
      currentIndexRef.current = 0;
      return;
    }

    const text = sentencesRef.current[idx];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rateRef.current;
    utterance.pitch = 1.0;

    // Pick Indian English or Hindi voice for natural Hinglish bro-tone cadence
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang === "hi-IN" || v.lang.startsWith("hi")) ||
      voices.find(
        (v) =>
          v.lang === "en-IN" ||
          v.name.toLowerCase().includes("india") ||
          v.name.toLowerCase().includes("neerja") ||
          v.name.toLowerCase().includes("prabhat") ||
          v.name.toLowerCase().includes("swara") ||
          v.name.toLowerCase().includes("madhur")
      ) ||
      voices.find((v) => v.lang.startsWith("en-") && v.name.includes("Natural")) ||
      voices.find((v) => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      if (isPlayingRef.current) {
        currentIndexRef.current = idx + 1;
        setCurrentSentenceIdx(idx + 1);
        speakChunk(idx + 1);
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== "canceled" && e.error !== "interrupted") {
        console.warn("Speech error:", e);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = async () => {
    if (!isSupported) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      isPlayingRef.current = true;
      return;
    }

    // If we have rawContent and haven't fetched the dedicated AI senior script yet, fetch it!
    if (rawContent && !scriptReady) {
      try {
        setIsGenerating(true);
        const res = await fetch("/api/audio/briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: subject || "Mumbai University Exam",
            title,
            content: rawContent,
          }),
        });

        const data = await res.json();
        if (data.ok && data.script) {
          const cleaned = cleanTextForSpeech(data.script);
          const chunks = splitIntoSentences(cleaned);
          setSentences(chunks);
          sentencesRef.current = chunks;
          setScriptReady(true);
          setIsGenerating(false);

          window.speechSynthesis.cancel();
          setIsPlaying(true);
          setIsPaused(false);
          isPlayingRef.current = true;
          currentIndexRef.current = 0;
          setCurrentSentenceIdx(0);
          speakChunk(0);
          return;
        }
      } catch (err) {
        console.warn("AI briefing fetch error, falling back to local text:", err);
      } finally {
        setIsGenerating(false);
      }
    }

    // Default playback
    const baseText = textToSpeak || rawContent || "";
    if (sentencesRef.current.length === 0) {
      const cleaned = cleanTextForSpeech(baseText);
      const chunks = splitIntoSentences(cleaned);
      setSentences(chunks);
      sentencesRef.current = chunks;
    }

    window.speechSynthesis.cancel();
    setIsPlaying(true);
    setIsPaused(false);
    isPlayingRef.current = true;
    speakChunk(currentIndexRef.current);
  };

  const handlePause = () => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const handleRestart = () => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    currentIndexRef.current = 0;
    setCurrentSentenceIdx(0);
    setIsPaused(false);
    setIsPlaying(true);
    isPlayingRef.current = true;
    speakChunk(0);
  };

  const handleSpeedToggle = (newRate: number) => {
    setRate(newRate);
    rateRef.current = newRate;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      speakChunk(currentIndexRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isSupported) return null;

  const total = sentences.length || 1;
  const progressPercent = Math.min(100, Math.round((currentSentenceIdx / total) * 100));

  return (
    <div
      className={`bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-md border border-indigo-900/60 transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                {title}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Senior Bro Briefing
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {subject ? `${subject} • ` : ""}Mumbai University exam passing strategy in 1 minute
            </p>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 self-start sm:self-auto">
          {[1.0, 1.25, 1.5, 2.0].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSpeedToggle(s)}
              className={`px-2 py-1 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                rate === s
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress & Live Controls */}
      <div className="pt-3.5 space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-slate-300">
            <span>
              {isGenerating
                ? "✨ Senior Topper preparing your exam briefing..."
                : isPlaying
                ? `Speaking segment ${currentSentenceIdx + 1} of ${total}`
                : isPaused
                ? "Paused"
                : "Ready to play"}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isGenerating ? "bg-amber-400 animate-pulse w-full" : "bg-indigo-400"
              }`}
              style={{ width: isGenerating ? "100%" : `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Currently Spoken Preview */}
        {isPlaying && sentences[currentSentenceIdx] && (
          <p className="text-xs italic text-indigo-200/90 bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-800/30 line-clamp-2">
            &ldquo;{sentences[currentSentenceIdx]}&rdquo;
          </p>
        )}

        {/* Control Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Briefing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isPaused ? "Resume Bro Briefing" : "Play Bro Briefing"}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Restart from beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
