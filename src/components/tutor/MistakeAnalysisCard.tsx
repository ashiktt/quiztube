'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, BrainCircuit } from 'lucide-react';
import { SafeMarkdown } from './SafeMarkdown';

interface MistakeAnalysisCardProps {
  data?: {
    studentAnswer?: string;
    correctAnswer?: string;
    whatWentWrong?: string;
    why?: string;
    howToRemember?: string;
  };
}

export function MistakeAnalysisCard({ data }: MistakeAnalysisCardProps) {
  if (!data) return null;

  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/70 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Mistake Diagnosis & Concept Clarification
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Targeted feedback to turn this mistake into permanent intuition
          </p>
        </div>
      </div>

      {/* Answer Comparison */}
      {(data.studentAnswer || data.correctAnswer) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {data.studentAnswer && (
            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Your Answer
              </span>
              <div className="text-xs font-semibold text-rose-950 dark:text-rose-200">
                {data.studentAnswer}
              </div>
            </div>
          )}

          {data.correctAnswer && (
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Correct Answer
              </span>
              <div className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                {data.correctAnswer}
              </div>
            </div>
          )}
        </div>
      )}

      {/* What Went Wrong */}
      {data.whatWentWrong && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            What Went Wrong:
          </span>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            <SafeMarkdown content={data.whatWentWrong} />
          </div>
        </div>
      )}

      {/* Why */}
      {data.why && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Underlying Mechanism (Why):
          </span>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            <SafeMarkdown content={data.why} />
          </div>
        </div>
      )}

      {/* How to Remember */}
      {data.howToRemember && (
        <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200">
          <BrainCircuit className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-indigo-900 dark:text-indigo-200 block mb-0.5">
              Memory Anchor / Mental Model:
            </strong>
            <p className="leading-relaxed text-indigo-800 dark:text-indigo-300">
              {data.howToRemember}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
