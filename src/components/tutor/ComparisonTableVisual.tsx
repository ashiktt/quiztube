'use client';

import React from 'react';
import { ComparisonTableData } from '@/types';
import { Columns3, Sparkles } from 'lucide-react';

interface ComparisonTableVisualProps {
  title?: string;
  data?: ComparisonTableData;
}

export function ComparisonTableVisual({ title, data }: ComparisonTableVisualProps) {
  if (!data || !data.headers || data.headers.length === 0) return null;

  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Columns3 className="w-4 h-4" />
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          {title || 'Side-by-Side Comparison Matrix'}
        </h4>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              {data.headers.map((header, idx) => (
                <th
                  key={idx}
                  className={`p-3 ${
                    idx === 0
                      ? 'font-medium text-slate-500 dark:text-slate-400'
                      : 'font-bold text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {data.rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`transition-colors ${
                  row.highlight
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-medium'
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {row.feature}
                </td>
                {row.values.map((val, valIdx) => (
                  <td key={valIdx} className="p-3 text-slate-600 dark:text-slate-300">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary takeaway */}
      {data.summaryTakeaway && (
        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold">Core Distinction:</strong> {data.summaryTakeaway}
          </p>
        </div>
      )}
    </div>
  );
}
