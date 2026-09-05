'use client';

import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Lightbulb, ChevronRight } from 'lucide-react';
import { SafeMarkdown } from './SafeMarkdown';

interface InteractivePracticeCardProps {
  question?: {
    question: string;
    options?: string[];
    correctOptionIndex?: number;
    explanation: string;
    hint?: string;
  };
}

export function InteractivePracticeCard({ question }: InteractivePracticeCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  if (!question || !question.question) return null;

  const hasOptions = Array.isArray(question.options) && question.options.length > 0;
  const correctIdx = question.correctOptionIndex ?? 0;
  const isCorrect = selectedOption === correctIdx;

  const handleSelect = (idx: number) => {
    if (!isSubmitted) {
      setSelectedOption(idx);
    }
  };

  const handleCheck = () => {
    if (selectedOption !== null) {
      setIsSubmitted(true);
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
  };

  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Test Your Understanding
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Apply what you just learned to check your comprehension
            </p>
          </div>
        </div>

        {question.hint && (
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 px-2 py-1 rounded-lg transition"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {showHint ? 'Hide Hint' : 'Hint'}
          </button>
        )}
      </div>

      {/* Hint Banner */}
      {showHint && question.hint && (
        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 animate-in fade-in">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Hint:</strong> {question.hint}
          </p>
        </div>
      )}

      {/* Question Prompt */}
      <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
        <SafeMarkdown content={question.question} />
      </div>

      {/* Options */}
      {hasOptions ? (
        <div className="space-y-2 pt-1">
          {question.options!.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            let optionStyles = 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-indigo-50/40 dark:hover:bg-slate-800';

            if (isSubmitted) {
              if (idx === correctIdx) {
                optionStyles = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
              } else if (isSelected && !isCorrect) {
                optionStyles = 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
              } else {
                optionStyles = 'border-slate-200 dark:border-slate-800 opacity-60';
              }
            } else if (isSelected) {
              optionStyles = 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 font-semibold text-indigo-900 dark:text-indigo-200 shadow-xs';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                disabled={isSubmitted}
                className={`w-full p-3 rounded-xl border text-left text-xs transition flex items-center justify-between gap-3 ${optionStyles}`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>

                {isSubmitted && idx === correctIdx && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                {isSubmitted && isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        // Open question reveal
        <div className="pt-2">
          {!isSubmitted ? (
            <button
              type="button"
              onClick={() => setIsSubmitted(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Reveal Answer & Explanation
            </button>
          ) : null}
        </div>
      )}

      {/* Action / Check Button */}
      {hasOptions && !isSubmitted && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={selectedOption === null}
            onClick={handleCheck}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
          >
            <span>Check My Answer</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Post-submission Feedback & Explanation */}
      {isSubmitted && (
        <div className="pt-2 space-y-2 animate-in fade-in">
          {hasOptions && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-medium ${
                isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
              }`}
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Great job! You have grasped this concept accurately.</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Not quite, but that is a common learning step! Here is the rationale:</span>
                </>
              )}
            </div>
          )}

          {question.explanation && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Pedagogical Explanation:
              </span>
              <SafeMarkdown content={question.explanation} />
            </div>
          )}

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
