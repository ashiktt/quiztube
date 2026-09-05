'use client';

import React from 'react';
import {
  GraduationCap,
  Sparkles,
  FolderOpen,
  Download,
  FileText,
  Shield,
  HelpCircle,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { YoutubeIcon, GithubIcon } from '@/components/Icons';
import { ANDROID_APK_URL, APK_CONFIG } from '@/config/apk';

interface FooterProps {
  onSwitchMode?: (mode: 'youtube' | 'examSolver' | 'tutor') => void;
  onOpenHistory?: () => void;
  onOpenApkModal?: () => void;
  onOpenLegalModal?: (type: 'terms' | 'privacy' | 'refund') => void;
}

export function Footer({
  onSwitchMode,
  onOpenHistory,
  onOpenApkModal,
  onOpenLegalModal,
}: FooterProps) {
  const isApkAvailable = Boolean(ANDROID_APK_URL && ANDROID_APK_URL.trim().length > 0);

  const handleDownloadClick = (e: React.MouseEvent) => {
    if (!isApkAvailable) {
      e.preventDefault();
      return;
    }
    // If modal guide exists, open it, otherwise allow direct download link
    if (onOpenApkModal) {
      onOpenApkModal();
    }
  };

  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 text-xs transition-colors mt-auto">
      {/* Top 4-Column Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* ========================================================= */}
          {/* 1. BRAND COLUMN */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  QuizTube
                </span>
                <p className="text-[11px] font-medium text-slate-400 leading-tight">
                  AI-powered learning for students
                </p>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
              Transform YouTube lectures into interactive quizzes and solve university exam papers with mark-proportional model answers.
            </p>

            {/* Creator Credit Button */}
            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs text-slate-400">Created by</span>
              <a
                href="https://personal-portfolio-blue-eight-9p8guawbf5.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition transform hover:scale-105 active:scale-95"
                title="Ashikur's Portfolio"
              >
                <span>Ashikur</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. PRODUCT COLUMN */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onSwitchMode && onSwitchMode('youtube')}
                  className="flex items-center gap-2 hover:text-white transition text-left"
                >
                  <YoutubeIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>YouTube Quiz</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSwitchMode && onSwitchMode('examSolver')}
                  className="flex items-center gap-2 hover:text-white transition text-left"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>University Solver</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSwitchMode && onSwitchMode('tutor')}
                  className="flex items-center gap-2 hover:text-white transition text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>AI Tutor</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenHistory && onOpenHistory()}
                  className="flex items-center gap-2 hover:text-white transition text-left"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Study Library</span>
                </button>
              </li>
            </ul>
          </div>

          {/* ========================================================= */}
          {/* 3. RESOURCES COLUMN */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenApkModal && onOpenApkModal()}
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition text-left font-medium"
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>Download Android App</span>
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/ashiktt/quiztube"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition"
                >
                  <GithubIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSwitchMode && onSwitchMode('youtube')}
                  className="flex items-center gap-2 hover:text-white transition text-left"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Documentation</span>
                </button>
              </li>
            </ul>
          </div>

          {/* ========================================================= */}
          {/* 4. SUPPORT COLUMN */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@quiztube.app"
                  className="flex items-center gap-2 hover:text-white transition"
                >
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Contact Support</span>
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('privacy')}
                  className="flex items-center gap-2 hover:text-white transition text-left"
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('terms')}
                  className="flex items-center gap-2 hover:text-white transition text-left"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Terms of Service</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DEDICATED ANDROID APK DOWNLOAD CALLOUT */}
        {/* ========================================================= */}
        <div className="mt-10 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/50">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-white flex items-center justify-center sm:justify-start gap-2">
                <span>Download QuizTube for Android</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  {APK_CONFIG.version ? `v${APK_CONFIG.version}` : 'Latest'}
                </span>
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Available for Android &middot; Offline practice, quizzes, and university solver
              </p>
            </div>
          </div>

          <div>
            {isApkAvailable ? (
              <a
                href={ANDROID_APK_URL}
                download="QuizTube.apk"
                onClick={handleDownloadClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition transform hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Download APK</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-slate-400 font-semibold text-xs rounded-xl border border-slate-700/60">
                Android app coming soon.
              </span>
            )}
          </div>
        </div>

        {/* Bottom Credits Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} QuizTube AI. Built for academic excellence.
          </p>
        </div>

      </div>
    </footer>
  );
}
