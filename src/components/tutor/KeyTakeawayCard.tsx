'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';
import { SafeMarkdown } from './SafeMarkdown';

interface KeyTakeawayCardProps {
  content: string;
}

export function KeyTakeawayCard({ content }: KeyTakeawayCardProps) {
  if (!content) return null;

  return (
    <div className="my-3.5 p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-3 shadow-xs">
      <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="w-4 h-4" />
      </div>

      <div className="space-y-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
          Core Key Takeaway
        </span>
        <div className="text-xs sm:text-sm font-medium text-amber-950 dark:text-amber-200 leading-relaxed">
          <SafeMarkdown content={content} />
        </div>
      </div>
    </div>
  );
}
