'use client';

import React from 'react';
import { FormulaBreakdownData } from '@/types';
import { Binary, Sparkles } from 'lucide-react';

interface FormulaBreakdownVisualProps {
  title?: string;
  data?: FormulaBreakdownData;
}

export function FormulaBreakdownVisual({ title, data }: FormulaBreakdownVisualProps) {
  if (!data || !data.formula) return null;

  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/60 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Binary className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            {data.name || title || 'Formula & Variable Breakdown'}
          </h4>
          {data.purpose && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {data.purpose}
            </p>
          )}
        </div>
      </div>

      {/* Prominent Formula Display */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white text-center shadow-inner">
        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 block mb-1">
          Core Equation
        </span>
        <div className="text-lg sm:text-2xl font-mono font-bold tracking-wide">
          {data.formula}
        </div>
      </div>

      {/* Variables Grid */}
      {data.variables && data.variables.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Variable Breakdown & Units
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.variables.map((v, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs flex items-center justify-center">
                    {v.symbol}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {v.meaning}
                    </div>
                  </div>
                </div>

                {v.unit && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    {v.unit}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {data.notes && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
          💡 Note: {data.notes}
        </p>
      )}
    </div>
  );
}
