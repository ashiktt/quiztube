'use client';

import React from 'react';
import { StudentUser, UserUsageSummary } from '@/types';
import { APK_CONFIG } from '@/config/apk';
import { LegalModalType } from './LegalModals';

interface AccountSubscriptionViewProps {
  user: StudentUser | null;
  usageSummary: UserUsageSummary | null;
  isPro: boolean;
  onOpenUpgradeModal: () => void;
  onOpenApkModal: () => void;
  onOpenLegalModal: (type: LegalModalType) => void;
  onLogout: () => void;
  onClose: () => void;
}

export function AccountSubscriptionView({
  user,
  usageSummary,
  isPro,
  onOpenUpgradeModal,
  onOpenApkModal,
  onOpenLegalModal,
  onLogout,
  onClose,
}: AccountSubscriptionViewProps) {
  const quizUsed = usageSummary?.quizAiUsed ?? 0;
  const quizLimit = usageSummary?.quizAiLimit ?? (isPro ? 100 : 2);
  const quizRemaining = usageSummary?.quizAiRemaining ?? (isPro ? 100 : Math.max(0, 2 - quizUsed));

  const solverUsed = usageSummary?.questionSolverUsed ?? 0;
  const solverLimit = usageSummary?.questionSolverLimit ?? (isPro ? 100 : 2);
  const solverRemaining = usageSummary?.questionSolverRemaining ?? (isPro ? 100 : Math.max(0, 2 - solverUsed));

  const expiryFormatted = usageSummary?.subscription?.expiryDate
    ? new Date(usageSummary.subscription.expiryDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
              {user?.fullName ? user.fullName[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">
                  {user?.fullName || user?.email?.split('@')[0] || 'My Account'}
                </h2>
                {isPro ? (
                  <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-full flex items-center space-x-1 shadow-sm shadow-amber-500/20">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>PRO</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 rounded-full">
                    FREE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{user?.email || 'Synced across Web & Android'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Plan Card */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isPro 
              ? 'bg-gradient-to-br from-indigo-950/60 via-purple-950/30 to-slate-900 border-indigo-500/40 shadow-xl shadow-indigo-950/40' 
              : 'bg-slate-800/40 border-slate-700/60'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                  Active Subscription Plan
                </div>
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span>{isPro ? 'QuizTube Pro' : 'QuizTube Free'}</span>
                  {isPro && <span className="text-sm font-normal text-slate-300">(&#8377;149 / month)</span>}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isPro
                    ? expiryFormatted
                      ? `Pro access valid until ${expiryFormatted}`
                      : 'Active 30-Day Pro pass with High AI limits'
                    : 'Standard student tier with daily free AI generations'}
                </p>
              </div>

              {!isPro ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUpgradeModal();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-[1.02]"
                >
                  Upgrade &middot; &#8377;149/mo
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUpgradeModal();
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold rounded-xl transition"
                >
                  Renew / Extend
                </button>
              )}
            </div>

            {/* Pro Features pills */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <svg className={`w-4 h-4 ${isPro ? 'text-amber-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">High AI limits</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <svg className={`w-4 h-4 ${isPro ? 'text-amber-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Adv. Question Solver</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <svg className={`w-4 h-4 ${isPro ? 'text-amber-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="font-medium">AI Tutor</span>
              </div>
            </div>
          </div>

          {/* Daily Quotas Card */}
          <div className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Daily AI Usage Quota</h4>
                <p className="text-xs text-slate-400">
                  Resets every midnight at 12:00 AM (<span className="text-indigo-400 font-mono">Asia/Kolkata</span>)
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                IST Timezone
              </span>
            </div>

            {/* Quiz AI Quota Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>Quiz AI (YouTube &rarr; Quiz)</span>
                </span>
                <span className="text-slate-400">
                  {isPro ? (
                    <span className="text-emerald-400 font-semibold">{quizUsed} used today (High Limit)</span>
                  ) : (
                    <span>
                      <strong className="text-white">{quizRemaining}</strong> of {quizLimit} remaining today
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-500 ${
                    quizRemaining === 0 && !isPro
                      ? 'bg-rose-500'
                      : quizRemaining === 1 && !isPro
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{
                    width: isPro ? `${Math.min(100, (quizUsed / 100) * 100)}%` : `${Math.min(100, (quizUsed / 2) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Question Solver Quota Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Question Solver (University Exam Solver)</span>
                </span>
                <span className="text-slate-400">
                  {isPro ? (
                    <span className="text-emerald-400 font-semibold">{solverUsed} used today (High Limit)</span>
                  ) : (
                    <span>
                      <strong className="text-white">{solverRemaining}</strong> of {solverLimit} remaining today
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-500 ${
                    solverRemaining === 0 && !isPro
                      ? 'bg-rose-500'
                      : solverRemaining === 1 && !isPro
                      ? 'bg-amber-500'
                      : 'bg-purple-500'
                  }`}
                  style={{
                    width: isPro ? `${Math.min(100, (solverUsed / 100) * 100)}%` : `${Math.min(100, (solverUsed / 2) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* AI Tutor Card */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isPro ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <span className="text-slate-300 font-medium">QuizTube AI Tutor</span>
              </div>
              <div>
                {isPro ? (
                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Full Access Unlocked</span>
                  </span>
                ) : (
                  <span className="text-slate-400">Pro Feature (Upgrade to Unlock)</span>
                )}
              </div>
            </div>
          </div>

          {/* Android App CTA */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4567c.1065-.1846.0432-.4207-.1414-.5272-.1848-.1065-.4209-.0432-.5274.1414l-2.0242 3.506c-1.5036-.6873-3.1953-1.0772-5.0135-1.0772-1.8182 0-3.5099.3899-5.0135 1.0772L5.1328 5.4789c-.1065-.1846-.3426-.2479-.5274-.1414-.1846.1065-.2479.3426-.1414.5272l1.996 3.4567C2.969 11.2644 1.5 14.7734 1.5 18.7778h21c0-4.0044-1.469-7.5134-5.0215-9.4564" />
                </svg>
              </div>
              <div>
                <h5 className="text-sm font-bold text-white">QuizTube for Android</h5>
                <p className="text-xs text-slate-400">Direct APK &middot; Version {APK_CONFIG.version} &middot; {APK_CONFIG.fileSize}</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenApkModal();
              }}
              className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs rounded-xl transition"
            >
              Get APK
            </button>
          </div>

          {/* Legal / Policy Links */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <button
              onClick={() => onOpenLegalModal('terms')}
              className="hover:text-indigo-300 transition underline underline-offset-2"
            >
              Terms of Service
            </button>
            <span>&middot;</span>
            <button
              onClick={() => onOpenLegalModal('privacy')}
              className="hover:text-indigo-300 transition underline underline-offset-2"
            >
              Privacy Policy
            </button>
            <span>&middot;</span>
            <button
              onClick={() => onOpenLegalModal('refund')}
              className="hover:text-indigo-300 transition underline underline-offset-2"
            >
              30-Day Pro & Refund Policy
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition"
          >
            Sign Out
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
