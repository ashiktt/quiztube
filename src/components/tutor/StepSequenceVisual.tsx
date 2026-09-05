'use client';

import React, { useState } from 'react';
import { StepSequenceItem } from '@/types';
import { ListOrdered, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface StepSequenceVisualProps {
  title?: string;
  steps?: StepSequenceItem[];
}

export function StepSequenceVisual({ title, steps }: StepSequenceVisualProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!steps || steps.length === 0) return null;

  const currentStep = steps[activeStepIndex] || steps[0];
  const isFirst = activeStepIndex === 0;
  const isLast = activeStepIndex === steps.length - 1;

  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/60 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ListOrdered className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            {title || 'Step-by-Step Execution Sequence'}
          </h4>
        </div>

        {/* Stepper controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setActiveStepIndex(i => Math.max(0, i - 1))}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Previous Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60">
            Step {activeStepIndex + 1} of {steps.length}
          </span>
          <button
            type="button"
            disabled={isLast}
            onClick={() => setActiveStepIndex(i => Math.min(steps.length - 1, i + 1))}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Next Step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {steps.map((step, idx) => {
          const isActive = idx === activeStepIndex;
          const isPassed = idx < activeStepIndex;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveStepIndex(idx)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isPassed
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Step {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Current Step Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Action
            </span>
            <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {currentStep.title}
            </h5>
            {currentStep.action && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {currentStep.action}
              </p>
            )}
          </div>

          {currentStep.isFinal && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Final Result
            </span>
          )}
        </div>

        {/* State or Calculation Display */}
        {currentStep.stateOrData && (
          <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
            <span className="text-[10px] uppercase text-indigo-400 font-bold block mb-1">
              Current State / Values:
            </span>
            {currentStep.stateOrData}
          </div>
        )}

        {/* Step Explanation */}
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
          {currentStep.explanation}
        </p>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => setActiveStepIndex(i => Math.max(0, i - 1))}
          className="text-slate-500 hover:text-indigo-600 disabled:opacity-0 transition"
        >
          ← Previous
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => setActiveStepIndex(i => Math.min(steps.length - 1, i + 1))}
          className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 disabled:opacity-0 transition"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}
