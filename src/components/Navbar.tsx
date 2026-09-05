'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  FolderOpen,
  Key,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  Download,
  Settings,
  Crown,
  ChevronDown,
} from 'lucide-react';
import { StudentUser } from '@/types';
import { YoutubeIcon } from '@/components/Icons';
import { SUBSCRIPTION_ENABLED } from '@/config/subscription';

interface NavbarProps {
  onOpenApiKeyModal: () => void;
  onOpenHistory: () => void;
  onNewQuiz: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onOpenUpgradeModal?: () => void;
  onOpenApkModal?: () => void;
  onOpenAccountModal?: () => void;
  currentUser: StudentUser | null;
  savedCount: number;
  hasApiKey: boolean;
  isPro?: boolean;
  appMode?: 'youtube' | 'examSolver' | 'tutor';
  onSwitchMode?: (mode: 'youtube' | 'examSolver' | 'tutor') => void;
}

export function Navbar({
  onOpenApiKeyModal,
  onOpenHistory,
  onNewQuiz,
  onOpenAuthModal,
  onSignOut,
  onOpenUpgradeModal,
  onOpenApkModal,
  onOpenAccountModal,
  currentUser,
  savedCount,
  hasApiKey,
  isPro = false,
  appMode = 'youtube',
  onSwitchMode,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on ESC key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setProfileDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = (mode: 'youtube' | 'examSolver' | 'tutor') => {
    if (onSwitchMode) onSwitchMode(mode);
    if (mode === 'youtube') onNewQuiz();
    setMobileMenuOpen(false);
  };

  const handleLibraryClick = () => {
    onOpenHistory();
    setMobileMenuOpen(false);
  };

  const userInitial = currentUser?.fullName
    ? currentUser.fullName[0].toUpperCase()
    : currentUser?.email
    ? currentUser.email[0].toUpperCase()
    : 'U';

  const displayName = currentUser?.fullName || currentUser?.email?.split('@')[0] || 'Account';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* ========================================================= */}
          {/* LEFT: QuizTube Branding */}
          {/* ========================================================= */}
          <button
            onClick={() => handleNavClick('youtube')}
            className="flex items-center gap-3 group text-left focus:outline-none shrink-0"
          >
            <div className="relative p-2.5 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                <span>QuizTube</span>
                {SUBSCRIPTION_ENABLED && isPro && (
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-amber-400 text-amber-950 rounded flex items-center gap-1 shadow-sm">
                    <Crown className="w-2.5 h-2.5 fill-current" />
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                AI-powered learning
              </p>
            </div>
          </button>

          {/* ========================================================= */}
          {/* CENTER: Main Desktop Navigation */}
          {/* ========================================================= */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {/* 1. YouTube Quiz */}
            <button
              type="button"
              onClick={() => handleNavClick('youtube')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                appMode === 'youtube'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-900/80'
              }`}
            >
              <YoutubeIcon className="w-4 h-4 text-red-500 shrink-0" />
              <span>YouTube Quiz</span>
            </button>

            {/* 2. University Solver */}
            <button
              type="button"
              onClick={() => handleNavClick('examSolver')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                appMode === 'examSolver'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-900/80'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-purple-500 shrink-0" />
              <span>University Solver</span>
            </button>

            {/* 3. AI Tutor */}
            <button
              type="button"
              onClick={() => handleNavClick('tutor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                appMode === 'tutor'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-900/80'
              }`}
            >
              <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
              <span>AI Tutor</span>
            </button>

            {/* 4. Study Library */}
            <button
              type="button"
              onClick={handleLibraryClick}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 transition"
            >
              <FolderOpen className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Study Library</span>
              {savedCount > 0 && (
                <span className="px-1.5 py-0.2 text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                  {savedCount}
                </span>
              )}
            </button>
          </nav>

          {/* ========================================================= */}
          {/* RIGHT: User Profile & Actions */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2.5">
            {/* Optional Pro Upgrade button only if SUBSCRIPTION_ENABLED */}
            {SUBSCRIPTION_ENABLED && !isPro && onOpenUpgradeModal && (
              <button
                onClick={onOpenUpgradeModal}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-md shadow-amber-500/20 transition active:scale-95"
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>Get Pro &middot; &#8377;149</span>
              </button>
            )}

            {/* Profile Avatar & Dropdown Menu */}
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold transition"
                  title="Account Menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    {userInitial}
                  </div>
                  <span className="hidden sm:inline font-medium text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                </button>

                {/* Dropdown Box */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-950/10 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.fullName || 'Student Account'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                      {SUBSCRIPTION_ENABLED && isPro && (
                        <span className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-amber-400 text-amber-950 rounded">
                          <Crown className="w-2.5 h-2.5 fill-current" />
                          Pro Member
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          if (onOpenAccountModal) onOpenAccountModal();
                          else onOpenAuthModal();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Profile & Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenApiKeyModal();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        <Key className="w-4 h-4 text-slate-400" />
                        <span>Gemini API Key</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5 text-red-600 dark:text-red-400 font-medium transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-sm transition active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 focus:outline-none transition"
              aria-label="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE NAVIGATION DRAWER */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-5 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-250">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg text-white">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">QuizTube</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">AI-powered learning</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Navigation Links */}
              <div className="py-4 space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavClick('youtube')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    appMode === 'youtube'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <YoutubeIcon className="w-4 h-4 text-red-500 shrink-0" />
                  <span>YouTube Quiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('examSolver')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    appMode === 'examSolver'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>University Solver</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('tutor')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    appMode === 'tutor'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
                  <span>AI Tutor</span>
                </button>

                <button
                  type="button"
                  onClick={handleLibraryClick}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Study Library</span>
                  </div>
                  {savedCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full">
                      {savedCount}
                    </span>
                  )}
                </button>

                {onOpenApkModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenApkModal();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
                  >
                    <Download className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Download Android App</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Footer / Profile section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {currentUser ? (
                <>
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {currentUser.fullName || 'Student'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenAccountModal) onOpenAccountModal();
                      else onOpenAuthModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Profile & Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenApiKeyModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  >
                    <Key className="w-4 h-4 text-slate-400" />
                    <span>Gemini API Key</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login / Register</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
