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
} from 'lucide-react';
import { YoutubeIcon } from '@/components/Icons';
import { DifficultyLevel, QuestionType, QuizGenerationRequest } from '@/types';
import { extractVideoId } from '@/lib/youtube';

interface LectureInputProps {
  onGenerate: (request: QuizGenerationRequest) => Promise<void>;
  isLoading: boolean;
  onLoadSample: () => void;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
      </div>

      {/* Main Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 transition-all">
        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'url'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <YoutubeIcon className="w-4 h-4 text-red-500" />
            <span>YouTube URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'text'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>Custom Notes / Text</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl animate-in fade-in">
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                    alt="Lecture thumbnail"
                    className="w-24 h-16 object-cover rounded-xl shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
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
                  Paste Transcript or Study Notes
                </label>
                <textarea
                  rows={5}
                  value={customTranscript}
                  onChange={e => {
                    setCustomTranscript(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Paste lecture transcript, slides content, or video notes here. Timestamp markers like [12:30] are automatically supported..."
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Number of Questions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Number of Questions
              </label>
              <select
                value={numQuestions}
                onChange={e => setNumQuestions(Number(e.target.value))}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={5}>5 Questions (Quick Check)</option>
                <option value={10}>10 Questions (Standard Quiz)</option>
                <option value={15}>15 Questions (In-Depth Review)</option>
                <option value={20}>20 Questions (Full Assessment)</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Target Difficulty
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="easy">Easy (Definitions & Recall)</option>
                <option value="medium">Medium (Application & Reasoning)</option>
                <option value="hard">Hard (Advanced & Nuanced Analysis)</option>
                <option value="mixed">Mixed (Balanced Multi-Tier)</option>
              </select>
            </div>

            {/* Question Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Question Format
              </label>
              <select
                value={questionType}
                onChange={e => setQuestionType(e.target.value as QuestionType)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="mcq">Multiple Choice (4 Options)</option>
                <option value="true_false">True / False</option>
                <option value="mixed">Mixed Formats</option>
              </select>
            </div>
          </div>

          {/* Advanced / Topic Focus Accordion */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Advanced & AI Model Options' : 'Advanced: Topic Focus & Model Selector (Optional)'}</span>
            </button>

            {showAdvanced && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl animate-in fade-in space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Focus on Specific Concept / Chapter
                  </label>
                  <input
                    type="text"
                    value={topicFocus}
                    onChange={e => setTopicFocus(e.target.value)}
                    placeholder="e.g. Focus heavily on Backpropagation and Mathematical proofs"
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
                    <option value="">Auto-Select & Fallback (Gemini 2.5 Flash / 3.7 Flash) [Recommended]</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-Stable & Fast)</option>
                    <option value="gemini-3.7-flash">Gemini 3.7 Flash (Hybrid Reasoning)</option>
                    <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (High Throughput)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Conceptual Analysis)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    If any model is experiencing high demand (503), QuizTube AI automatically falls back to an alternate model.
                  </p>
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
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base text-white shadow-lg flex items-center justify-center gap-3 transition-all ${
                isLoading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-500 hover:shadow-indigo-500/25 active:scale-[0.99]'
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
              <span>Or try a popular educational lecture:</span>
            </span>
            <button
              onClick={onLoadSample}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Load Instant Demo Set
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SAMPLE_LECTURES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample.url)}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl text-left transition group"
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
