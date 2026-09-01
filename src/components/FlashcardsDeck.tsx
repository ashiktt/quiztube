'use client';

import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Sparkles,
  Check,
  X,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Play,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Flashcard } from '@/types';

interface FlashcardsDeckProps {
  flashcards: Flashcard[];
  onSeekVideo: (seconds: number) => void;
}

export function FlashcardsDeck({ flashcards, onSeekVideo }: FlashcardsDeckProps) {
  const [cards, setCards] = useState<Flashcard[]>(flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCards(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds(new Set());
    setReviewIds(new Set());
  }, [flashcards]);

  // Keyboard navigation (Space to flip, Arrow keys to navigate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(f => !f);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length]);

  if (!cards || cards.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <Layers className="w-10 h-10 mx-auto text-slate-400 mb-2" />
        <p className="font-semibold">No flashcards available for this lecture.</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex] || cards[0];
  const isMastered = masteredIds.has(currentCard.id);
  const isNeedsReview = reviewIds.has(currentCard.id);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(i => (i + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(i => (i - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const handleMarkMastered = () => {
    setMasteredIds(prev => {
      const next = new Set(prev);
      next.add(currentCard.id);
      return next;
    });
    setReviewIds(prev => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  };

  const handleMarkNeedsReview = () => {
    setReviewIds(prev => {
      const next = new Set(prev);
      next.add(currentCard.id);
      return next;
    });
    setMasteredIds(prev => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  };

  const progressPercent = Math.round((masteredIds.size / cards.length) * 100);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Bar: Progress, Shuffle, Counter */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Shuffle Deck"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>

        {/* Mastered Progress */}
        <div className="flex items-center gap-2">
          <div className="w-24 sm:w-36 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {masteredIds.size}/{cards.length} Mastered
          </span>
        </div>
      </div>

      {/* 3D Flashcard Container */}
      <div
        className="relative w-full h-80 sm:h-96 cursor-pointer select-none perspective-1000 group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT SIDE */}
          <div
            className={`absolute inset-0 w-full h-full p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-2 rounded-3xl shadow-xl flex flex-col justify-between backface-hidden transition-all ${
              isMastered
                ? 'border-emerald-300 dark:border-emerald-800'
                : isNeedsReview
                ? 'border-amber-300 dark:border-amber-800'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200/80 dark:border-indigo-800/80">
                {currentCard.topicTag || 'Key Concept'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Click / Space to Flip</span>
              </span>
            </div>

            {/* Front Prompt */}
            <div className="text-center my-auto px-4">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentCard.front}
              </h3>
            </div>

            {/* Bottom Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Front (Concept / Question)</span>
              {currentCard.timestampFormatted && (
                <span className="text-indigo-500 font-mono">
                  Lecture: {currentCard.timestampFormatted}
                </span>
              )}
            </div>
          </div>

          {/* BACK SIDE */}
          <div
            className={`absolute inset-0 w-full h-full p-8 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-950 border-2 rounded-3xl shadow-xl flex flex-col justify-between backface-hidden transition-all ${
              isMastered
                ? 'border-emerald-400 dark:border-emerald-700'
                : isNeedsReview
                ? 'border-amber-400 dark:border-amber-700'
                : 'border-indigo-300 dark:border-indigo-800'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
                Definition & Key Takeaway
              </span>

              {currentCard.timestampSeconds !== undefined && currentCard.timestampSeconds > 0 && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    if (currentCard.timestampSeconds) {
                      onSeekVideo(currentCard.timestampSeconds);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded-lg px-2.5 py-1 border border-red-200 dark:border-red-800 transition"
                >
                  <Play className="w-3 h-3 text-red-500 fill-red-500" />
                  <span>Jump to {currentCard.timestampFormatted}</span>
                </button>
              )}
            </div>

            {/* Back Explanation */}
            <div className="my-auto px-4 space-y-3">
              <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                {currentCard.back}
              </p>

              {currentCard.keyTakeaway && (
                <div className="p-3 bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900 rounded-xl text-xs sm:text-sm text-indigo-900 dark:text-indigo-200">
                  <span className="font-bold">🧠 Memory Anchor: </span>
                  {currentCard.keyTakeaway}
                </div>
              )}
            </div>

            {/* Bottom Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Back (Explanation)</span>
              <span>Click to flip back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={handlePrev}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          title="Previous Card"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkNeedsReview}
            className="flex items-center gap-2 px-5 py-3 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-semibold text-xs sm:text-sm rounded-2xl border border-amber-200 dark:border-amber-800 transition shadow-sm active:scale-95"
          >
            <X className="w-4 h-4 text-amber-600" />
            <span>Needs Review</span>
          </button>

          <button
            onClick={handleMarkMastered}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition shadow-emerald-500/20 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Mastered (Got it)</span>
          </button>
        </div>

        <button
          onClick={handleNext}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          title="Next Card"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
