'use client';

import React from 'react';
import {
  GraduationCap,
  Sparkles,
  FolderOpen,
  Bot,
} from 'lucide-react';
import { YoutubeIcon } from '@/components/Icons';

interface MobileBottomNavProps {
  appMode: 'youtube' | 'examSolver' | 'tutor' | 'copilot';
  onSwitchMode: (mode: 'youtube' | 'examSolver' | 'tutor' | 'copilot') => void;
  onOpenHistory: () => void;
  savedCount: number;
  hide?: boolean;
}

export function MobileBottomNav({
  appMode,
  onSwitchMode,
  onOpenHistory,
  savedCount,
  hide = false,
}: MobileBottomNavProps) {
  if (hide) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#07091B]/95 backdrop-blur-2xl border-t border-indigo-500/20 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1.5 max-w-lg mx-auto">
        {/* 1. YouTube Quiz */}
        <button
          type="button"
          onClick={() => onSwitchMode('youtube')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 min-h-[48px] ${
            appMode === 'youtube'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              appMode === 'youtube'
                ? 'bg-purple-600/30 text-white shadow-[0_0_14px_rgba(147,51,234,0.5)] ring-1 ring-purple-400/60'
                : ''
            }`}
          >
            <YoutubeIcon className="w-4 h-4 text-red-500" />
          </div>
          <span className={`text-[10px] font-bold tracking-tight truncate max-w-full ${
            appMode === 'youtube' ? 'text-white font-extrabold' : 'text-slate-400'
          }`}>
            Quiz
          </span>
        </button>

        {/* 2. University Solver */}
        <button
          type="button"
          onClick={() => onSwitchMode('examSolver')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 min-h-[48px] ${
            appMode === 'examSolver'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              appMode === 'examSolver'
                ? 'bg-indigo-600/30 text-white shadow-[0_0_14px_rgba(99,102,241,0.5)] ring-1 ring-indigo-400/60'
                : ''
            }`}
          >
            <GraduationCap
              className={`w-4 h-4 ${
                appMode === 'examSolver' ? 'text-indigo-400' : 'text-slate-400'
              }`}
            />
          </div>
          <span className={`text-[10px] font-bold tracking-tight truncate max-w-full ${
            appMode === 'examSolver' ? 'text-white font-extrabold' : 'text-slate-400'
          }`}>
            Solver
          </span>
        </button>

        {/* 3. AI Tutor */}
        <button
          type="button"
          onClick={() => onSwitchMode('tutor')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 min-h-[48px] ${
            appMode === 'tutor'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              appMode === 'tutor'
                ? 'bg-pink-600/30 text-white shadow-[0_0_14px_rgba(236,72,153,0.5)] ring-1 ring-pink-400/60'
                : ''
            }`}
          >
            <Sparkles
              className={`w-4 h-4 ${
                appMode === 'tutor' ? 'text-pink-400' : 'text-slate-400'
              }`}
            />
          </div>
          <span className={`text-[10px] font-bold tracking-tight truncate max-w-full ${
            appMode === 'tutor' ? 'text-white font-extrabold' : 'text-slate-400'
          }`}>
            Tutor
          </span>
        </button>

        {/* 4. Student Copilot */}
        <button
          type="button"
          onClick={() => onSwitchMode('copilot')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 min-h-[48px] ${
            appMode === 'copilot'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              appMode === 'copilot'
                ? 'bg-emerald-600/30 text-white shadow-[0_0_14px_rgba(16,185,129,0.5)] ring-1 ring-emerald-400/60'
                : ''
            }`}
          >
            <Bot
              className={`w-4 h-4 ${
                appMode === 'copilot' ? 'text-emerald-400' : 'text-slate-400'
              }`}
            />
          </div>
          <span className={`text-[10px] font-bold tracking-tight truncate max-w-full ${
            appMode === 'copilot' ? 'text-white font-extrabold' : 'text-slate-400'
          }`}>
            Copilot
          </span>
        </button>

        {/* 5. Library */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 min-h-[48px] text-slate-400 hover:text-slate-200 relative"
        >
          <div className="p-1.5 rounded-xl relative">
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] text-[9px] font-bold bg-purple-600 text-white rounded-full flex items-center justify-center shadow-xs">
                {savedCount > 9 ? '9+' : savedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight truncate max-w-full text-slate-400">
            Library
          </span>
        </button>
      </div>
    </nav>
  );
}
