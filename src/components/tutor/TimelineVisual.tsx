'use client';

import React from 'react';
import { TimelineEventData } from '@/types';
import { Clock, Calendar } from 'lucide-react';

interface TimelineVisualProps {
  title?: string;
  events?: TimelineEventData[];
}

export function TimelineVisual({ title, events }: TimelineVisualProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Clock className="w-4 h-4" />
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          {title || 'Historical & Chronological Timeline'}
        </h4>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-900">
        {events.map((ev, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-6 sm:-left-8 top-1 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-400 shadow-xs" />

            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5 transition hover:bg-indigo-50/30 dark:hover:bg-slate-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  <Calendar className="w-3 h-3" />
                  {ev.dateOrPeriod}
                </span>

                {ev.significance && (
                  <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 rounded-full">
                    {ev.significance}
                  </span>
                )}
              </div>

              <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {ev.title}
              </h5>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {ev.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
