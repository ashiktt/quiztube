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
  Bot,
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
  appMode?: 'youtube' | 'examSolver' | 'tutor' | 'copilot';
  onSwitchMode?: (mode: 'youtube' | 'examSolver' | 'tutor' | 'copilot') => void;
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

  // Lock body scroll when mobile navigation drawer is open, safely restore on close/unmount
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleNavClick = (mode: 'youtube' | 'examSolver' | 'tutor' | 'copilot') => {
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
  const isAdmin = Boolean(currentUser?.isAdmin);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-indigo-500/20 bg-[#07091B]/85 backdrop-blur-[18px] relative transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-purple-500/40 after:to-transparent after:pointer-events-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* ========================================================= */}
          {/* LEFT: Saberio AI Branding */}
          {/* ========================================================= */}
          <button
            onClick={() => handleNavClick('youtube')}
            className="flex items-center gap-2.5 sm:gap-3 group text-left focus:outline-none shrink min-w-0"
          >
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-[0_0_18px_rgba(139,92,246,0.35)] ring-1 ring-purple-500/40 group-hover:scale-105 transition-transform duration-200 shrink-0 border border-purple-500/30 bg-purple-950/40">
              <img
                src="/icon.png"
                alt="Saberio AI"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-extrabold text-base sm:text-xl text-white tracking-tight truncate drop-shadow-[0_2px_8px_rgba(139,92,246,0.3)]">
                <span>Saberio AI</span>
                {SUBSCRIPTION_ENABLED && isPro && (
                  <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase bg-amber-400 text-amber-950 rounded flex items-center gap-1 shadow-sm shrink-0">
                    <Crown className="w-2.5 h-2.5 fill-current" />
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 leading-tight truncate hidden xs:block">
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                appMode === 'youtube'
                  ? 'bg-gradient-to-r from-purple-600/25 to-blue-600/25 border border-purple-500/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10'
              }`}
            >
              <YoutubeIcon className="w-4 h-4 text-red-500 shrink-0" />
              <span>YouTube Quiz</span>
            </button>

            {/* 2. University Solver */}
            <button
              type="button"
              onClick={() => handleNavClick('examSolver')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                appMode === 'examSolver'
                  ? 'bg-gradient-to-r from-purple-600/25 to-indigo-600/25 border border-purple-500/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
              <span>University Solver</span>
            </button>

            {/* 3. AI Tutor */}
            <button
              type="button"
              onClick={() => handleNavClick('tutor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                appMode === 'tutor'
                  ? 'bg-gradient-to-r from-pink-600/25 to-purple-600/25 border border-pink-500/50 text-white shadow-[0_0_15px_rgba(236,72,153,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10'
              }`}
            >
              <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
              <span>AI Tutor</span>
            </button>

            {/* 4. Student Copilot */}
            <button
              type="button"
              onClick={() => handleNavClick('copilot')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                appMode === 'copilot'
                  ? 'bg-gradient-to-r from-teal-600/25 to-cyan-600/25 border border-teal-500/50 text-white shadow-[0_0_15px_rgba(20,184,166,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10'
              }`}
            >
              <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Student Copilot</span>
              <span className="px-1.5 py-0.2 text-[8px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                AI
              </span>
            </button>

            {/* 5. Study Library */}
            <button
              type="button"
              onClick={handleLibraryClick}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all duration-200"
            >
              <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Study Library</span>
              {savedCount > 0 && (
                <span className="px-1.5 py-0.2 text-[11px] font-bold bg-purple-950/80 border border-purple-500/40 text-purple-300 rounded-full">
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
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 rounded-xl text-xs font-semibold text-white transition-all shadow-sm shadow-black/20"
                  title="Account Menu"
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={displayName}
                      className="w-7 h-7 rounded-lg object-cover shrink-0 shadow-sm border border-indigo-500/40"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      {userInitial}
                    </div>
                  )}
                  <span className="hidden sm:inline font-medium text-slate-200 max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                </button>

                {/* Dropdown Box */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#0c102b]/95 backdrop-blur-2xl border border-indigo-500/30 rounded-2xl shadow-2xl shadow-black/60 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-indigo-500/20">
                      <p className="font-bold text-white truncate">
                        {currentUser.fullName || 'Student Account'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
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
                        className="w-full text-left px-3.5 py-2 hover:bg-white/[0.08] flex items-center gap-2.5 text-slate-300 hover:text-white font-medium transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Profile & Account</span>
                      </button>

                      {/* Admin-only: Gemini API Key connection */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenApiKeyModal();
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-white/[0.08] flex items-center gap-2.5 text-slate-300 hover:text-white font-medium transition"
                        >
                          <Key className="w-4 h-4 text-amber-400" />
                          <span>Gemini API Key</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-indigo-500/20">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-red-950/40 flex items-center gap-2.5 text-red-400 font-medium transition"
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-md shadow-indigo-600/30 transition active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] focus:outline-none transition"
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
            className="fixed inset-0 bg-[#07091B]/80 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-[#07091B]/95 backdrop-blur-2xl border-l border-indigo-500/25 shadow-2xl p-4 sm:p-5 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-250 pt-safe pb-safe overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-indigo-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-purple-500/30 shadow-[0_0_12px_rgba(139,92,246,0.3)]">
                    <img
                      src="/icon.png"
                      alt="Saberio AI"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Saberio AI</h3>
                    <p className="text-[10px] text-slate-400">AI-powered learning</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Navigation Links */}
              <div className="py-3 sm:py-4 space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleNavClick('youtube')}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition active:scale-[0.98] ${
                    appMode === 'youtube'
                      ? 'bg-gradient-to-r from-purple-600/25 to-blue-600/25 border border-purple-500/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <YoutubeIcon className="w-4 h-4 text-red-500 shrink-0" />
                  <span>YouTube Quiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('examSolver')}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition active:scale-[0.98] ${
                    appMode === 'examSolver'
                      ? 'bg-gradient-to-r from-purple-600/25 to-indigo-600/25 border border-purple-500/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>University Solver</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('tutor')}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition active:scale-[0.98] ${
                    appMode === 'tutor'
                      ? 'bg-gradient-to-r from-pink-600/25 to-purple-600/25 border border-pink-500/50 text-white shadow-[0_0_15px_rgba(236,72,153,0.25)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>AI Tutor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('copilot')}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition active:scale-[0.98] ${
                    appMode === 'copilot'
                      ? 'bg-gradient-to-r from-teal-600/25 to-cyan-600/25 border border-teal-500/50 text-white shadow-[0_0_15px_rgba(20,184,166,0.25)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Student Copilot</span>
                  </div>
                  <span className="px-1.5 py-0.2 text-[8px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                    AI
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleLibraryClick}
                  className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-white/[0.06] transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Study Library</span>
                  </div>
                  {savedCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-purple-950/80 border border-purple-500/40 text-purple-300 rounded-full">
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
                    className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-emerald-400 hover:bg-white/[0.06] transition active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Download Android App</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Footer / Profile section */}
            <div className="pt-4 border-t border-indigo-500/20 space-y-2">
              {currentUser ? (
                <>
                  <div className="px-3.5 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl">
                    <p className="font-bold text-xs sm:text-sm text-white truncate">
                      {currentUser.fullName || 'Student'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
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
                    className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] active:scale-[0.98] transition"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Profile & Account</span>
                  </button>

                  {/* Admin-only: Gemini API Key connection */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenApiKeyModal();
                      }}
                      className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] active:scale-[0.98] transition"
                    >
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>Gemini API Key</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-red-400 hover:bg-red-950/40 transition active:scale-[0.98]"
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
                  className="w-full min-h-[44px] py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2 active:scale-[0.98]"
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
