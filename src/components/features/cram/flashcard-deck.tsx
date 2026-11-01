"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Check,
  RotateCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Award,
  Layers,
} from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { HoloCard3D } from "./holo-card-3d";
import type { FlashcardsPayload, FlashcardItem } from "@/lib/schemas/cram";

interface FlashcardDeckProps {
  payload: FlashcardsPayload;
  onBack?: () => void;
}

export function FlashcardDeck({ payload, onBack }: FlashcardDeckProps) {
  const [cards, setCards] = useState<FlashcardItem[]>(payload.cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<string[]>([]);
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentCard = cards[currentIndex];

  // Flip handler
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Answer handler
  const handleAnswer = useCallback(
    (gotIt: boolean) => {
      if (!currentCard) return;

      if (gotIt) {
        setKnownIds((prev) => (prev.includes(currentCard.id) ? prev : [...prev, currentCard.id]));
        setReviewIds((prev) => prev.filter((id) => id !== currentCard.id));
      } else {
        setReviewIds((prev) => (prev.includes(currentCard.id) ? prev : [...prev, currentCard.id]));
      }

      setIsFlipped(false);

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsCompleted(true);
      }
    },
    [currentCard, currentIndex, cards.length]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleAnswer(false);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleAnswer(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleAnswer, isCompleted]);

  // Restart full deck
  const handleRestartFull = () => {
    setCards(payload.cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds([]);
    setReviewIds([]);
    setIsCompleted(false);
  };

  // Study only review cards
  const handleStudyMissed = () => {
    const missedCards = payload.cards.filter((c) => reviewIds.includes(c.id));
    if (missedCards.length > 0) {
      setCards(missedCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsCompleted(false);
    }
  };

  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="mb-1">
            <BackButton fallbackUrl="/student" label="Back to Student Portal" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {payload.subject}
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-[6px]">
              3D Holo Flashcards
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{payload.title}</p>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-slate-700">
            Card {currentIndex + 1} of {cards.length}
          </div>
          <div className="text-[11px] text-slate-400">
            {knownIds.length} Mastered &bull; {reviewIds.length} Review
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5 rounded-[3px] overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {!isCompleted && currentCard ? (
        <div className="space-y-6">
          {/* 3D Holo Card Component */}
          <HoloCard3D card={currentCard} isFlipped={isFlipped} onFlip={handleFlip} />

          {/* Action Controls */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => handleAnswer(false)}
              className="flex-1 py-3 px-3 sm:px-4 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-[6px] shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Review<span className="hidden sm:inline"> (←)</span></span>
            </button>

            <button
              type="button"
              onClick={handleFlip}
              className="py-3 px-4 sm:px-5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-[6px] shadow-sm transition-colors cursor-pointer"
            >
              <span>Flip<span className="hidden sm:inline"> (Space)</span></span>
            </button>

            <button
              type="button"
              onClick={() => handleAnswer(true)}
              className="flex-1 py-3 px-3 sm:px-4 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-[6px] shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Mastered<span className="hidden sm:inline"> (→)</span></span>
            </button>
          </div>
        </div>
      ) : (
        /* Completion Screen */
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Deck Session Completed!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Active recall cycle finished for {payload.subject}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[6px]">
              <div className="text-2xl font-bold text-emerald-700">{knownIds.length}</div>
              <div className="text-xs font-semibold text-emerald-600">Concepts Mastered</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-[6px]">
              <div className="text-2xl font-bold text-amber-700">{reviewIds.length}</div>
              <div className="text-xs font-semibold text-amber-600">Need Another Look</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {reviewIds.length > 0 && (
              <button
                type="button"
                onClick={handleStudyMissed}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-[6px] transition-colors"
              >
                Study Missed ({reviewIds.length})
              </button>
            )}

            <button
              type="button"
              onClick={handleRestartFull}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-[6px] transition-colors"
            >
              Restart All ({payload.cards.length})
            </button>

            <Link
              href="/student"
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-[6px] transition-colors"
            >
              Done
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

