'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Clock,
  Play,
  Lightbulb,
  FileText,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import { LectureStudySet } from '@/types';

interface SummaryNotesProps {
  studySet: LectureStudySet;
  onSeekVideo: (seconds: number) => void;
}

export function SummaryNotes({ studySet, onSeekVideo }: SummaryNotesProps) {
  const [copiedTakeaways, setCopiedTakeaways] = useState(false);

  const handleCopyTakeaways = () => {
    const text = studySet.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTakeaways(true);
    setTimeout(() => setCopiedTakeaways(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Overview Card */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Lecture Summary & Core Concepts
            </h2>
            <p className="text-xs text-slate-500">
              Generated synthesis of {studySet.videoTitle}
            </p>
          </div>
        </div>

        <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 whitespace-pre-line pt-2">
          {studySet.overallSummary}
        </div>
      </div>

      {/* High-Yield Key Takeaways */}
      {studySet.keyTakeaways && studySet.keyTakeaways.length > 0 && (
        <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-xl">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                High-Yield Key Takeaways
              </h3>
            </div>

            <button
              onClick={handleCopyTakeaways}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition shadow-sm"
            >
              {copiedTakeaways ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Takeaways</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {studySet.keyTakeaways.map((takeaway, idx) => (
              <div
                key={idx}
                className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl flex items-start gap-3 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {takeaway}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapters & Interactive Timestamps */}
      {studySet.chapters && studySet.chapters.length > 0 && (
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Lecture Outline & Synced Timestamps
              </h3>
              <p className="text-xs text-slate-500">
                Click any timestamp to jump to that moment in the video
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {studySet.chapters.map((chapter, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition group"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Chapter {idx + 1}</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {chapter.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {chapter.summary}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSeekVideo(chapter.timestampSeconds)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/60 border border-slate-200 dark:border-slate-700 rounded-xl transition shrink-0 self-start sm:self-center"
                >
                  <Play className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  <span>Play at {chapter.timestampFormatted}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
