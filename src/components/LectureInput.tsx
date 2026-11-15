'use client';

import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  SlidersHorizontal,
  Play,
  HelpCircle,
  AlertCircle,
  Layers,
  CheckCircle2,
  BrainCircuit,
  ArrowRight,
  Flame,
  Crown,
  Clock,
} from 'lucide-react';
import { YoutubeIcon } from '@/components/Icons';
import { DifficultyLevel, QuestionType, QuizGenerationRequest, UserUsageSummary } from '@/types';
import { SUBSCRIPTION_ENABLED } from '@/config/subscription';
import { extractVideoId } from '@/lib/youtube';
import { GlyphBackground } from '@/components/animate-ui/backgrounds/glyph';

interface LectureInputProps {
  onGenerate: (request: QuizGenerationRequest) => Promise<void>;
  isLoading: boolean;
  onLoadSample: () => void;
  usageSummary?: UserUsageSummary | null;
  isPro?: boolean;
  onOpenUpgradeModal?: () => void;
}

const SAMPLE_LECTURES = [
  {
    title: 'MIT 6.S191: Intro to Deep Learning',
    url: 'https://www.youtube.com/watch?v=7sB052Pz0sU',
    tag: 'Computer Science',
    difficulty: 'medium' as DifficultyLevel,
  },
  {
    title: 'Harvard CS50: Data Structures & Algorithms',
    url: 'https://www.youtube.com/watch?v=2T-A_3avFbU',
    tag: 'Algorithms',
    difficulty: 'medium' as DifficultyLevel,
  },
  {
    title: 'CrashCourse: Photosynthesis & Cellular Respiration',
    url: 'https://www.youtube.com/watch?v=sQK3Yr4Sc_k',
    tag: 'Biology',
    difficulty: 'easy' as DifficultyLevel,
  },
];

export function LectureInput({
  onGenerate,
  isLoading,
  onLoadSample,
  usageSummary,
  isPro = false,
  onOpenUpgradeModal,
}: LectureInputProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customTranscript, setCustomTranscript] = useState('');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [topicFocus, setTopicFocus] = useState('');
  const [preferredModel, setPreferredModel] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoId = extractVideoId(url);

  // Daily Quotas
  const quizRemaining = usageSummary?.quizAiRemaining ?? (isPro ? 100 : 2);
  const isQuotaExhausted = !isPro && quizRemaining <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isQuotaExhausted) {
      setErrorMessage(
        'You have reached your daily limit of 2 free Quiz AI generations. Quota resets at 12:00 AM IST (Asia/Kolkata). Upgrade to QuizTube Pro for high limits.'
      );
      if (onOpenUpgradeModal) onOpenUpgradeModal();
      return;
    }

    if (activeTab === 'url') {
      if (!url.trim()) {
        setErrorMessage('Please enter a YouTube video URL.');
        return;
      }
      if (!videoId) {
        setErrorMessage('Please enter a valid YouTube video link (e.g. https://www.youtube.com/watch?v=...)');
        return;
      }
    } else {
      if (!customTranscript.trim() || customTranscript.trim().length < 50) {
        setErrorMessage('Please provide a detailed lecture transcript or study notes (at least 50 characters).');
        return;
      }
    }

    try {
      await onGenerate({
        url: activeTab === 'url' ? url.trim() : undefined,
        customTranscript: activeTab === 'text' ? customTranscript.trim() : undefined,
        title: customTitle.trim() || undefined,
        numQuestions,
        difficulty,
        questionType,
        topicFocus: topicFocus.trim() || undefined,
        preferredModel: preferredModel || undefined,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate quiz. Please check your inputs or API key.');
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setActiveTab('url');
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-emerald-500/20 bg-[#080D0B]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <GlyphBackground
          className="absolute inset-0 z-0 pointer-events-none opacity-45"
          fontSize={10}
          interactive={true}
          glowColor="#10B981"
          shapeColor="#34D399"
        />
        <div className="relative z-10 text-center space-y-4 animate-hero-fade">
          {/* Glow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-200 bg-emerald-950/50 backdrop-blur-md border border-emerald-500/40 rounded-full shadow-[0_0_16px_rgba(16,185,129,0.3)] hover:border-emerald-400 hover:shadow-[0_0_24px_rgba(16,185,129,0.5)] transition-all duration-300 group cursor-default">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse group-hover:scale-110 transition-transform" />
            <span>AI-Powered Active Recall for Students</span>
          </div>

          {/* Hero Headline with Midnight Aurora Typography */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Convert YouTube Lectures into{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(16,185,129,0.35)]">
              Smart
            </span>{' '}
            <span className="relative inline-block whitespace-nowrap">
              <span className="bg-gradient-to-r from-teal-300 via-emerald-400 to-mint-400 bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(52,211,153,0.4)]">
                Quizzes
              </span>
              {/* Small curved animated gradient underline beneath "Quizzes" */}
              <svg
                className="absolute -bottom-2 sm:-bottom-2.5 left-0 w-full h-2.5 sm:h-3 overflow-visible pointer-events-none"
                viewBox="0 0 100 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 9C25 3 75 3 98 9"
                  stroke="url(#aurora-underline-grad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="animated-underline-curve"
                />
                <defs>
                  <linearGradient id="aurora-underline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#6EE7B7" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Paste any educational video or lecture notes to instantly generate interactive multiple-choice questions, visual cheatsheets, timestamped video links, and summary sheets.
          </p>

          {/* Daily Quota Indicator Badge (Only when subscriptions are enabled) */}
          {SUBSCRIPTION_ENABLED && (
            <div className="flex items-center justify-center gap-2 pt-1 text-xs">
              {isPro ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-full font-medium shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                  <Crown className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span>QuizTube Pro &middot; High AI usage limits</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0c102b]/80 border border-emerald-500/30 text-slate-300 rounded-full shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Free Daily Quota: <strong className="text-emerald-300 font-bold">{quizRemaining}/2</strong> generations remaining today (Asia/Kolkata)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Input Card - Futuristic AI Workspace Container */}
      <div className="relative overflow-hidden bg-[#0c102b]/85 backdrop-blur-2xl border border-emerald-500/25 rounded-[24px] p-4 sm:p-8 shadow-[0_0_60px_-15px_rgba(16,185,129,0.2)] space-y-5 sm:space-y-6 transition-all duration-300">
        <GlyphBackground
          className="absolute inset-0 z-0 pointer-events-none opacity-30"
          fontSize={10}
          interactive={true}
          glowColor="#10B981"
          shapeColor="#34D399"
        />
        <div className="relative z-10 space-y-5 sm:space-y-6">
        {/* Subtle top edge lighting */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent pointer-events-none" />

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1 bg-[#070a1e]/90 border border-purple-500/25 rounded-2xl max-w-md mx-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'url'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_18px_rgba(147,51,234,0.35)] border border-purple-400/50'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <YoutubeIcon className="w-4 h-4 text-red-500 shrink-0" />
            <span>YouTube URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'text'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_18px_rgba(147,51,234,0.35)] border border-purple-400/50'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Custom Notes</span>
          </button>
        </div>

        {/* Quota Exhausted Banner (Only when subscriptions are enabled) */}
        {SUBSCRIPTION_ENABLED && isQuotaExhausted && (
          <div className="p-4 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Crown className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-bold text-white">Daily Free Quiz AI Limit Reached</h4>
                <p className="text-[11px] sm:text-xs text-slate-300">
                  You have used 2/2 free generations for today (IST timezone). Upgrade to Pro for High AI limits.
                </p>
              </div>
            </div>
            {onOpenUpgradeModal && (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition transform hover:scale-[1.02] shrink-0"
              >
                Upgrade &middot; &#8377;149/mo
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* URL Tab Content */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  YouTube Lecture URL
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 pointer-events-none">
                    <YoutubeIcon className="w-5 h-5 text-red-500" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={e => {
                      setUrl(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#080c24]/90 border border-purple-500/30 text-white placeholder:text-slate-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Video Thumbnail Preview */}
              {videoId && (
                <div className="flex items-center gap-3 sm:gap-4 p-3 bg-[#080c24]/80 border border-purple-500/30 rounded-2xl animate-in fade-in shadow-md">
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                    alt="Lecture thumbnail"
                    className="w-20 sm:w-24 h-14 sm:h-16 object-cover rounded-xl shadow-md border border-purple-500/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                      Target Lecture Detected
                    </span>
                    <p className="text-xs text-slate-400 font-mono truncate">
                      Video ID: {videoId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Text Tab Content */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Lecture Title / Topic
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="e.g., Organic Chemistry: Carbonyl Chemistry Reactions"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-[#080c24]/90 border border-purple-500/30 text-white placeholder:text-slate-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Lecture Transcript / Study Notes
                </label>
                <textarea
                  rows={6}
                  value={customTranscript}
                  onChange={e => {
                    setCustomTranscript(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Paste lecture transcript, reading material, or lecture slides text here..."
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-[#080c24]/90 border border-purple-500/30 text-white placeholder:text-slate-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] resize-y"
                />
              </div>
            </div>
          )}

          {/* Quick Config Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Number of Questions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Questions
              </label>
              <select
                value={numQuestions}
                onChange={e => setNumQuestions(Number(e.target.value))}
                disabled={isLoading}
                className="w-full min-h-[44px] px-3 py-2.5 bg-[#080c24]/90 border border-purple-500/30 text-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
              >
                <option value={5} className="bg-[#0c102b] text-white">5 Questions</option>
                <option value={10} className="bg-[#0c102b] text-white">10 Questions</option>
                <option value={15} className="bg-[#0c102b] text-white">15 Questions</option>
                <option value={20} className="bg-[#0c102b] text-white">20 Questions</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
                disabled={isLoading}
                className="w-full min-h-[44px] px-3 py-2.5 bg-[#080c24]/90 border border-purple-500/30 text-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
              >
                <option value="easy" className="bg-[#0c102b] text-white">Easy (Foundations)</option>
                <option value="medium" className="bg-[#0c102b] text-white">Medium (Standard)</option>
                <option value="hard" className="bg-[#0c102b] text-white">Hard (Advanced)</option>
                <option value="adaptive" className="bg-[#0c102b] text-white">Adaptive</option>
              </select>
            </div>

            {/* Question Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Format
              </label>
              <select
                value={questionType}
                onChange={e => setQuestionType(e.target.value as QuestionType)}
                disabled={isLoading}
                className="w-full min-h-[44px] px-3 py-2.5 bg-[#080c24]/90 border border-purple-500/30 text-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
              >
                <option value="mcq" className="bg-[#0c102b] text-white">MCQ (Multiple Choice)</option>
                <option value="flashcards" className="bg-[#0c102b] text-white">Flashcards</option>
                <option value="mixed" className="bg-[#0c102b] text-white">Mixed Assessment</option>
              </select>
            </div>
          </div>

          {/* Advanced Accordion Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-purple-300 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
              <span>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Settings (Topic Focus, Model)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 bg-[#080c24]/80 border border-purple-500/25 rounded-2xl space-y-3 animate-in fade-in shadow-inner">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Topic Focus / Specific Concept
                  </label>
                  <input
                    type="text"
                    value={topicFocus}
                    onChange={e => setTopicFocus(e.target.value)}
                    placeholder="e.g., Focus specifically on gradient descent and backpropagation"
                    className="w-full px-3.5 py-2.5 bg-[#0c102b] border border-purple-500/30 text-white placeholder:text-slate-500 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Gemini AI Model
                  </label>
                  <select
                    value={preferredModel}
                    onChange={e => setPreferredModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0c102b] border border-purple-500/30 text-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400"
                  >
                    <option value="" className="bg-[#0c102b] text-white">Auto-Select & Fallback (Gemini 3.8 Flash / 3.7 Flash) [Recommended]</option>
                    <option value="gemini-3.8-flash" className="bg-[#0c102b] text-white">Gemini 3.8 Flash (Latest & Fast)</option>
                    <option value="gemini-3.7-flash" className="bg-[#0c102b] text-white">Gemini 3.7 Flash (Hybrid Reasoning & Fast)</option>
                    <option value="gemini-3.5-flash-lite" className="bg-[#0c102b] text-white">Gemini 3.5 Flash Lite (High Throughput)</option>
                    <option value="gemini-3.1-pro-preview" className="bg-[#0c102b] text-white">Gemini 3.1 Pro Preview (Deep Conceptual Analysis)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-950/50 border border-red-500/40 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-red-300 animate-in fade-in shadow-md">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-white">Unable to generate quiz</p>
                <p className="text-xs text-red-200/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Generate Button with Midnight Aurora Glowing Gradient */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-bold text-sm sm:text-base text-white shadow-xl flex items-center justify-center gap-2.5 sm:gap-3 transition-all duration-300 min-h-[48px] active:scale-[0.98] group ${
                isLoading
                  ? 'bg-purple-900/60 cursor-not-allowed opacity-80'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-[0_0_30px_rgba(147,51,234,0.35)] hover:shadow-[0_0_45px_rgba(147,51,234,0.55)] hover:scale-[1.01]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Lecture & Generating Quiz...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  <span>Generate Interactive Study Set</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sample Lectures Section */}
        <div className="pt-4 border-t border-indigo-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Popular educational lectures:</span>
            </span>
            <button
              onClick={onLoadSample}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline"
            >
              Load Instant Demo
            </button>
          </div>

          <div className="flex sm:grid sm:grid-cols-3 gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {SAMPLE_LECTURES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample.url)}
                className="p-3 bg-[#080c24]/70 hover:bg-purple-950/40 border border-purple-500/20 hover:border-purple-400/50 rounded-xl text-left transition-all duration-200 group min-w-[240px] sm:min-w-0 shrink-0 sm:shrink shadow-sm"
              >
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 border border-purple-500/30 text-purple-300 rounded group-hover:bg-purple-900 group-hover:text-purple-200 mb-1">
                  {sample.tag}
                </span>
                <p className="text-xs font-medium text-slate-300 line-clamp-1 group-hover:text-white">
                  {sample.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
