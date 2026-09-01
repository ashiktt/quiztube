'use client';

import React from 'react';
import {
  X,
  Trash2,
  BookOpen,
  Trophy,
  Layers,
  ArrowRight,
  Sparkles,
  FolderOpen,
} from 'lucide-react';
import { LectureStudySet } from '@/types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedSets: LectureStudySet[];
  currentSetId?: string;
  onSelectSet: (set: LectureStudySet) => void;
  onDeleteSet: (id: string) => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  savedSets,
  currentSetId,
  onSelectSet,
  onDeleteSet,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  My Study Library
                </h2>
                <p className="text-xs text-slate-500">
                  {savedSets.length} saved lecture study sets
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {savedSets.length === 0 ? (
              <div className="text-center py-16 space-y-3 text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium">No saved study sets yet.</p>
                <p className="text-xs text-slate-500">
                  Generate a quiz from any YouTube lecture to save it here!
                </p>
              </div>
            ) : (
              savedSets.map(set => {
                const isCurrent = set.id === currentSetId;
                const latestAttempt = set.attempts && set.attempts[0];

                return (
                  <div
                    key={set.id}
                    className={`p-4 rounded-2xl border transition group relative ${
                      isCurrent
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {set.thumbnailUrl ? (
                        <img
                          src={set.thumbnailUrl}
                          alt="Thumbnail"
                          className="w-20 h-14 object-cover rounded-xl shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-20 h-14 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                          {set.videoTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {set.channelTitle}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-500">
                          <span className="font-semibold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 uppercase">
                            {set.difficulty}
                          </span>
                          <span>{set.questions.length} Questions</span>
                          <span>•</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Visual Cheatsheet</span>
                        </div>
                      </div>
                    </div>

                    {/* Attempt score if available */}
                    {latestAttempt && (
                      <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span>Last Score:</span>
                        </span>
                        <span
                          className={`font-bold ${
                            latestAttempt.percentage >= 70
                              ? 'text-emerald-600'
                              : 'text-indigo-600'
                          }`}
                        >
                          {latestAttempt.percentage}% ({latestAttempt.score}/{latestAttempt.total})
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSet(set);
                          onClose();
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>{isCurrent ? 'Currently Active' : 'Study This Lecture'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSet(set.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Delete from saved"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
