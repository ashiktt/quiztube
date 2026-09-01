'use client';

import React from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Key,
  PlusCircle,
  FolderOpen,
  Share2,
} from 'lucide-react';

interface NavbarProps {
  onOpenApiKeyModal: () => void;
  onOpenHistory: () => void;
  onNewQuiz: () => void;
  savedCount: number;
  hasApiKey: boolean;
}

export function Navbar({
  onOpenApiKeyModal,
  onOpenHistory,
  onNewQuiz,
  savedCount,
  hasApiKey,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onNewQuiz}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="relative p-2.5 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <GraduationCap className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-lg text-slate-900 dark:text-white tracking-tight">
              <span>QuizTube</span>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 rounded-md border border-indigo-200/60 dark:border-indigo-800">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Turn YouTube lectures into interactive quizzes & visual cheatsheets
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onNewQuiz}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition border border-slate-200 dark:border-slate-800"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>New Lecture</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition border border-slate-200 dark:border-slate-800 relative"
          >
            <FolderOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">My Study Library</span>
            {savedCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
                {savedCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition border ${
              hasApiKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasApiKey ? 'Gemini API Connected' : 'Set Gemini Key'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
