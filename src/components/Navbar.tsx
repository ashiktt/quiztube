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
  appMode?: 'youtube' | 'examSolver' | 'tutor';
  onSwitchMode?: (mode: 'youtube' | 'examSolver' | 'tutor') => void;
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
    <>
      {/* Top App Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors pt-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand */}
          <button
            onClick={onNewQuiz}
            className="flex items-center gap-2.5 sm:gap-3 group text-left focus:outline-none shrink-0"
          >
            <div className="relative p-2 sm:p-2.5 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-purple-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                <span>QuizTube</span>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 rounded-md border border-indigo-200/60 dark:border-indigo-800">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden xl:block">
                YouTube Lectures & University Exam Question Solver
              </p>
            </div>
          </button>

          {/* Desktop Center Mode Switcher Tabs */}
          {onSwitchMode && (
            <div className="hidden sm:flex items-center p-1 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl">
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

              <button
                type="button"
                onClick={() => onSwitchMode('tutor')}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition relative ${
                  appMode === 'tutor'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm shadow-purple-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Tutor</span>
                <span className="px-1 py-0.2 text-[9px] font-extrabold uppercase bg-indigo-500 text-white rounded-full">
                  AI
                </span>
              </button>
            </div>
          )}

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Desktop Study Library Button */}
            <button
              onClick={onOpenHistory}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition border border-slate-200 dark:border-slate-800 relative"
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
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl transition border ${
                hasApiKey
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100'
              }`}
              title="Configure Gemini API Key"
            >
              <Key className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{hasApiKey ? 'Gemini Ready' : 'API Key'}</span>
            </button>

            {/* Student Auth Button / Profile Menu */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-extrabold uppercase shrink-0">
                    {currentUser.fullName ? currentUser.fullName[0] : currentUser.email ? currentUser.email[0] : 'S'}
                  </div>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300 max-w-[80px] sm:max-w-[90px] truncate hidden sm:inline">
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
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-sm transition active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Native Android Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
          {/* 1. YouTube Quiz Tab */}
          <button
            type="button"
            onClick={() => {
              if (onSwitchMode) onSwitchMode('youtube');
              onNewQuiz();
            }}
            className={`flex flex-col items-center justify-center py-1.5 gap-1 transition rounded-xl ${
              appMode === 'youtube'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${appMode === 'youtube' ? 'bg-indigo-50 dark:bg-indigo-950/80' : ''}`}>
              <YoutubeIcon className="w-5 h-5" />
            </div>
            <span className="text-[9px] leading-none">YouTube</span>
          </button>

          {/* 2. University Solver Tab */}
          <button
            type="button"
            onClick={() => {
              if (onSwitchMode) onSwitchMode('examSolver');
            }}
            className={`flex flex-col items-center justify-center py-1.5 gap-1 transition rounded-xl relative ${
              appMode === 'examSolver'
                ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${appMode === 'examSolver' ? 'bg-purple-50 dark:bg-purple-950/80' : ''}`}>
              <FileQuestion className="w-5 h-5" />
            </div>
            <span className="text-[9px] leading-none">Solver</span>
          </button>

          {/* 3. AI Tutor Tab */}
          <button
            type="button"
            onClick={() => {
              if (onSwitchMode) onSwitchMode('tutor');
            }}
            className={`flex flex-col items-center justify-center py-1.5 gap-1 transition rounded-xl relative ${
              appMode === 'tutor'
                ? 'text-pink-600 dark:text-pink-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${appMode === 'tutor' ? 'bg-pink-50 dark:bg-pink-950/80' : ''}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[9px] leading-none">AI Tutor</span>
          </button>

          {/* 4. Study Library Tab */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex flex-col items-center justify-center py-1.5 gap-1 transition rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 relative"
          >
            <div className="relative p-1">
              <FolderOpen className="w-5 h-5" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1.5 px-1 py-0.2 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-extrabold bg-purple-600 text-white rounded-full">
                  {savedCount}
                </span>
              )}
            </div>
            <span className="text-[9px] leading-none">Library</span>
          </button>

          {/* 5. Student Auth / Settings Tab */}
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                onOpenApiKeyModal();
              } else {
                onOpenAuthModal();
              }
            }}
            className="flex flex-col items-center justify-center py-1.5 gap-1 transition rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <div className="p-1">
              {currentUser ? (
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-extrabold uppercase">
                  {currentUser.fullName ? currentUser.fullName[0] : currentUser.email ? currentUser.email[0] : 'S'}
                </div>
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <span className="text-[9px] leading-none">
              {currentUser ? 'Account' : 'Sign In'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
