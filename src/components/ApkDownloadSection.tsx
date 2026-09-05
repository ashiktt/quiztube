'use client';

import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  X,
  ExternalLink,
  Info,
  Sparkles,
  Layers,
  ArrowRight,
  HardDrive,
  Calendar,
} from 'lucide-react';
import { APK_CONFIG } from '@/config/apk';

interface ApkDownloadSectionProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandalonePage?: boolean;
}

export function ApkDownloadSection({
  isOpen = true,
  onClose,
  isStandalonePage = false,
}: ApkDownloadSectionProps) {
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen && !isStandalonePage) return null;

  const handleDownload = () => {
    setDownloadStarted(true);
    // Trigger download
    const link = document.createElement('a');
    link.href = APK_CONFIG.downloadUrl;
    link.download = 'QuizTube.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const content = (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-400 text-emerald-950 rounded-full">
              Official Release
            </span>
            <span className="text-xs text-indigo-200 font-mono">
              Version {APK_CONFIG.version}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Download QuizTube for Android
          </h2>

          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Get the full native Android app experience with offline study set caching, hardware-accelerated lecture quizzes, and 24/7 AI Tutor access on your phone.
          </p>

          {/* Quick Specs Pill Grid */}
          <div className="flex flex-wrap gap-2 pt-2 text-[11px] text-indigo-100">
            <span className="px-2.5 py-1 bg-white/10 rounded-xl flex items-center gap-1.5 backdrop-blur-xs">
              <HardDrive className="w-3.5 h-3.5 text-indigo-300" />
              <span>{APK_CONFIG.fileSize}</span>
            </span>
            <span className="px-2.5 py-1 bg-white/10 rounded-xl flex items-center gap-1.5 backdrop-blur-xs">
              <Smartphone className="w-3.5 h-3.5 text-indigo-300" />
              <span>{APK_CONFIG.minAndroidVersion}</span>
            </span>
            <span className="px-2.5 py-1 bg-white/10 rounded-xl flex items-center gap-1.5 backdrop-blur-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
              <span>Updated {APK_CONFIG.releaseDate}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Download Button Card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4 text-center">
        <button
          type="button"
          onClick={handleDownload}
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/20 transition transform active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
        >
          <Download className="w-5 h-5 animate-bounce" />
          <span>Download APK (v{APK_CONFIG.version})</span>
        </button>

        {downloadStarted && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Download started! Follow the installation steps below.</span>
          </div>
        )}

        {/* Direct Distribution Disclaimer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl text-left space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Direct Website Distribution Notice</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            This APK is digitally signed and distributed directly from the official QuizTube website (not distributed through Google Play Store). It contains the exact same secure code, Supabase account sync, and verified student features.
          </p>
        </div>
      </div>

      {/* Step-by-Step Installation Guide */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-purple-600" />
          <span>How to Install on Android (6 Simple Steps)</span>
        </h3>

        <div className="space-y-3">
          {APK_CONFIG.installSteps.map(step => (
            <div
              key={step.stepNumber}
              className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {step.stepNumber}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0 text-left">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What's New in This Version */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>What's New in QuizTube v{APK_CONFIG.version}</span>
        </h3>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
          {APK_CONFIG.changelog.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (isStandalonePage) {
    return <div className="py-6 px-3">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {content}
      </div>
    </div>
  );
}
