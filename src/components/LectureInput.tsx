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
      <div className="text-center space-y-3 pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 rounded-full shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>AI-Powered Active Recall for Students</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Convert YouTube Lectures into{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Smart Quizzes
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Paste any educational video or lecture notes to instantly generate interactive multiple-choice questions, visual cheatsheets, timestamped video links, and summary sheets.
        </p>

        {/* Daily Quota Indicator Badge (Only when subscriptions are enabled) */}
        {SUBSCRIPTION_ENABLED && (
          <div className="flex items-center justify-center gap-2 pt-1 text-xs">
            {isPro ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full font-medium">
                <Crown className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>QuizTube Pro &middot; High AI usage limits</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  Free Daily Quota: <strong className="text-indigo-600 dark:text-indigo-400">{quizRemaining}/2</strong> generations remaining today (Asia/Kolkata)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5 sm:space-y-6 transition-all">
        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'url'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <YoutubeIcon className="w-4 h-4 text-red-500 shrink-0" />
            <span>YouTube URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'text'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Custom Notes</span>
          </button>
        </div>

        {/* Quota Exhausted Banner (Only when subscriptions are enabled) */}
        {SUBSCRIPTION_ENABLED && isQuotaExhausted && (
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
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
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Video Thumbnail Preview */}
              {videoId && (
                <div className="flex items-center gap-3 sm:gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl animate-in fade-in">
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                    alt="Lecture thumbnail"
                    className="w-20 sm:w-24 h-14 sm:h-16 object-cover rounded-xl shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Target Lecture Detected
                    </span>
                    <p className="text-xs text-slate-500 font-mono truncate">
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Lecture Title / Topic
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="e.g., Organic Chemistry: Carbonyl Chemistry Reactions"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>
            </div>
          )}

          {/* Quick Config Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Number of Questions */}
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Questions
              </label>
              <select
                value={numQuestions}
                onChange={e => setNumQuestions(Number(e.target.value))}
                disabled={isLoading}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
                disabled={isLoading}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="easy">Easy (Foundations)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="hard">Hard (Advanced)</option>
                <option value="adaptive">Adaptive</option>
              </select>
            </div>

            {/* Question Style */}
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Format
              </label>
              <select
                value={questionType}
                onChange={e => setQuestionType(e.target.value as QuestionType)}
                disabled={isLoading}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="mcq">MCQ (Multiple Choice)</option>
                <option value="flashcards">Flashcards</option>
                <option value="mixed">Mixed Assessment</option>
              </select>
            </div>
          </div>

          {/* Advanced Accordion Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Settings (Topic Focus, Model)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3 animate-in fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Topic Focus / Specific Concept
                  </label>
                  <input
                    type="text"
                    value={topicFocus}
                    onChange={e => setTopicFocus(e.target.value)}
                    placeholder="e.g., Focus specifically on gradient descent and backpropagation"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Gemini AI Model
                  </label>
                  <select
                    value={preferredModel}
                    onChange={e => setPreferredModel(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Auto-Select & Fallback (Gemini 3.7 Flash / 2.5 Flash / 3.1 Pro) [Recommended]</option>
                    <option value="gemini-3.7-flash">Gemini 3.7 Flash (Hybrid Reasoning & Fast)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-Stable)</option>
                    <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (High Throughput)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Deep Conceptual Analysis)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300 animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Unable to generate quiz</p>
                <p className="text-xs opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-bold text-sm sm:text-base text-white shadow-lg flex items-center justify-center gap-2.5 sm:gap-3 transition-all min-h-[48px] active:scale-[0.98] ${
                isLoading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-500 hover:shadow-indigo-500/25'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Lecture & Generating Quiz...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-5 h-5" />
                  <span>Generate Interactive Study Set</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sample Lectures Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Popular educational lectures:</span>
            </span>
            <button
              onClick={onLoadSample}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
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
                className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl text-left transition group min-w-[240px] sm:min-w-0 shrink-0 sm:shrink"
              >
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900 group-hover:text-indigo-800 dark:group-hover:text-indigo-200 mb-1">
                  {sample.tag}
                </span>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {sample.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
