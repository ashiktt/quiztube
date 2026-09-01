'use client';

import React from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Key,
  PlusCircle,
  FolderOpen,
  User,
  LogOut,
  LogIn,
  FileQuestion,
} from 'lucide-react';
import { StudentUser } from '@/types';
import { YoutubeIcon } from '@/components/Icons';

interface NavbarProps {
  onOpenApiKeyModal: () => void;
  onOpenHistory: () => void;
  onNewQuiz: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  currentUser: StudentUser | null;
  savedCount: number;
  hasApiKey: boolean;
  appMode?: 'youtube' | 'examSolver';
  onSwitchMode?: (mode: 'youtube' | 'examSolver') => void;
}

export function Navbar({
  onOpenApiKeyModal,
  onOpenHistory,
  onNewQuiz,
  onOpenAuthModal,
  onSignOut,
  currentUser,
  savedCount,
  hasApiKey,
  appMode = 'youtube',
  onSwitchMode,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <button
          onClick={onNewQuiz}
          className="flex items-center gap-3 group text-left focus:outline-none shrink-0"
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
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden xl:block">
              YouTube Lectures & University Exam Question Solver
            </p>
          </div>
        </button>

        {/* Center Mode Switcher Tabs */}
        {onSwitchMode && (
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => onSwitchMode('youtube')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                appMode === 'youtube'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <YoutubeIcon className="w-3.5 h-3.5" />
              <span>YouTube Quiz</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchMode('examSolver')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition relative ${
                appMode === 'examSolver'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>University Solver</span>
              <span className="px-1 py-0.2 text-[9px] font-extrabold uppercase bg-amber-400 text-amber-950 rounded-full">
                New
              </span>
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Study Library Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition border border-slate-200 dark:border-slate-800 relative"
          >
            <FolderOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="hidden md:inline">My Study Library</span>
            {savedCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
                {savedCount}
              </span>
            )}
          </button>

          {/* Gemini API Status Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition border ${
              hasApiKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{hasApiKey ? 'Gemini Ready' : 'Set API Key'}</span>
          </button>

          {/* Student Auth Button / Profile Menu */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-extrabold uppercase">
                  {currentUser.fullName ? currentUser.fullName[0] : currentUser.email ? currentUser.email[0] : 'S'}
                </div>
                <span className="font-bold text-indigo-700 dark:text-indigo-300 max-w-[90px] truncate hidden sm:inline">
                  {currentUser.fullName || currentUser.email?.split('@')[0]}
                </span>
              </div>

              <button
                onClick={onSignOut}
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-sm transition active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
