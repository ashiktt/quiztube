'use client';

import React, { useState } from 'react';
import { CodeFlowData } from '@/types';
import { Code2, Play, Check, Copy } from 'lucide-react';

interface CodeFlowVisualProps {
  title?: string;
  data?: CodeFlowData;
}

export function CodeFlowVisual({ title, data }: CodeFlowVisualProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  if (!data || !data.code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {title || 'Code & Execution Flow Trace'}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
            {data.language || 'code'}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Box */}
      <div className="rounded-xl overflow-hidden bg-slate-950 text-slate-100 border border-slate-800 text-xs font-mono">
        <pre className="p-3.5 overflow-x-auto leading-relaxed">
          <code>{data.code}</code>
        </pre>
      </div>

      {/* Execution Trace Stepper */}
      {data.executionSteps && data.executionSteps.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
              <Play className="w-3 h-3 fill-current" />
              Trace Execution Step {activeStep + 1} of {data.executionSteps.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {data.executionSteps[activeStep]?.description}
            </p>
            {data.executionSteps[activeStep]?.variableState && (
              <div className="p-2 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-indigo-400 block">
                  Variable Scope State:
                </span>
                {data.executionSteps[activeStep].variableState}
              </div>
            )}
          </div>

          {/* Stepper buttons */}
          <div className="flex gap-1.5 overflow-x-auto pt-1">
            {data.executionSteps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                  idx === activeStep
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Line/Step {idx + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
