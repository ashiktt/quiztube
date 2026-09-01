'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  FileText,
  Clock,
  Play,
  FileDown,
  ArrowLeft,
  GraduationCap,
  Award,
  Flame,
  CheckCircle2,
  Brain,
  Lightbulb,
  Share2,
  FolderOpen,
  PlusCircle,
  AlertTriangle,
  ExternalLink,
  Heart,
} from 'lucide-react';
import { LectureStudySet, QuizGenerationRequest, UserQuizAttempt } from '@/types';
import { Navbar } from '@/components/Navbar';
import { LectureInput } from '@/components/LectureInput';
import { VideoPlayer } from '@/components/VideoPlayer';
import { QuizInterface } from '@/components/QuizInterface';
import { FlashcardsDeck } from '@/components/FlashcardsDeck';
import { SummaryNotes } from '@/components/SummaryNotes';
import { CheatsheetView } from '@/components/CheatsheetView';
import { ExportModal } from '@/components/ExportModal';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import {
  getSavedStudySets,
  saveStudySet,
  deleteStudySet,
  saveQuizAttempt,
  getStoredApiKey,
  fetchAndMergeCloudStudySets,
} from '@/lib/storage';
import { SAMPLE_STUDY_SET } from '@/lib/sampleData';

export default function Home() {
  const [studySet, setStudySet] = useState<LectureStudySet | null>(null);
  const [savedSets, setSavedSets] = useState<LectureStudySet[]>([]);
  const [activeTab, setActiveTab] = useState<'cheatsheet' | 'quiz' | 'summary'>('cheatsheet');
  const [currentVideoTimestamp, setCurrentVideoTimestamp] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Modals & Drawers
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);

  // Initial load & Supabase sync
  useEffect(() => {
    const initialSets = getSavedStudySets();
    setSavedSets(initialSets);
    const localKey = getStoredApiKey();

    // Check server environment variable status (e.g. Vercel)
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        const serverActive = Boolean(data?.hasServerKey);
        setHasServerKey(serverActive);
        setHasApiKey(Boolean(localKey || serverActive));
      })
      .catch(() => {
        setHasApiKey(Boolean(localKey));
      });

    // Cloud Database Sync (Supabase)
    fetchAndMergeCloudStudySets()
      .then(({ sets, isCloudConnected }) => {
        setSavedSets(sets);
        setIsCloudConnected(isCloudConnected);
      })
      .catch(err => console.warn('Supabase sync error:', err));
  }, []);

  const handleGenerateQuiz = async (request: QuizGenerationRequest) => {
    setIsGenerating(true);
    try {
      const storedKey = getStoredApiKey();
      const payload: QuizGenerationRequest = {
        ...request,
        apiKey: storedKey || undefined,
      };

      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data?.error?.includes('Gemini API key is required')) {
          setApiKeyModalOpen(true);
        }
        throw new Error(data?.error || 'Failed to generate quiz.');
      }

      const newStudySet: LectureStudySet = data.studySet;
      setStudySet(newStudySet);
      saveStudySet(newStudySet);
      setSavedSets(getSavedStudySets());
      setActiveTab('cheatsheet');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadSample = () => {
    setStudySet(SAMPLE_STUDY_SET);
    saveStudySet(SAMPLE_STUDY_SET);
    setSavedSets(getSavedStudySets());
    setActiveTab('cheatsheet');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSeekVideo = (seconds: number) => {
    setCurrentVideoTimestamp(seconds);
  };

  const handleQuizComplete = (attempt: UserQuizAttempt) => {
    if (!studySet) return;
    const updated = saveQuizAttempt(studySet.id, attempt);
    if (updated) {
      setStudySet(updated);
      setSavedSets(getSavedStudySets());
    }
  };

  const handleDeleteSavedSet = (id: string) => {
    deleteStudySet(id);
    const updated = getSavedStudySets();
    setSavedSets(updated);
    if (studySet?.id === id) {
      setStudySet(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Navbar */}
      <Navbar
        onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
        onOpenHistory={() => setHistoryDrawerOpen(true)}
        onNewQuiz={() => setStudySet(null)}
        savedCount={savedSets.length}
        hasApiKey={hasApiKey}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {!studySet ? (
          /* Landing / Input Screen */
          <div className="space-y-12">
            <LectureInput
              onGenerate={handleGenerateQuiz}
              isLoading={isGenerating}
              onLoadSample={handleLoadSample}
            />

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit">
                  <Play className="w-6 h-6 text-red-500 fill-red-500" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Timestamp-Synced Review
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Every question and explanation maps to the exact video timestamp. If you miss a question, 1-click jumps the lecture player to where the concept is taught.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 rounded-2xl w-fit">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Visual Study Cheatsheet & Diagrams
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Generates interactive visual flowcharts (Mermaid), core formula cards, comparison tables, and exam pitfall analysis.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit">
                  <FileDown className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Printable Assessment & PDF Export
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Export quizzes and cheatsheets as student-ready printable PDFs with separate answer keys, detailed explanations, and Markdown notes.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Study Set Workspace */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Workspace Header */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setStudySet(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mr-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Input</span>
                  </button>

                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800">
                    {studySet.difficulty} Level
                  </span>

                  <span className="text-xs text-slate-400 font-mono">
                    {studySet.questions.length} Questions • Visual Cheatsheet & Formulas
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight line-clamp-2">
                  {studySet.videoTitle}
                </h1>
                <p className="text-xs text-slate-500">{studySet.channelTitle}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setExportModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition shadow-sm"
                >
                  <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Export Materials</span>
                </button>

                <button
                  onClick={() => setStudySet(null)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-500/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Lecture</span>
                </button>
              </div>
            </div>

            {/* Study Workspace Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Embedded Video & Chapter Outline (Sticky on Desktop) */}
              <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
                <VideoPlayer
                  videoId={studySet.videoId}
                  currentTimestamp={currentVideoTimestamp}
                />

                {/* Quick Chapter Shortcuts */}
                {studySet.chapters && studySet.chapters.length > 0 && (
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Lecture Timeline</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Click to jump video</span>
                    </div>

                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                      {studySet.chapters.map((ch, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSeekVideo(ch.timestampSeconds)}
                          className="w-full p-2 rounded-xl text-left text-xs hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition flex items-center justify-between group"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {ch.title}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400 font-bold shrink-0 ml-2 group-hover:text-indigo-500">
                            {ch.timestampFormatted}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Tabbed Interactive Study Hub */}
              <div className="lg:col-span-7 space-y-6">
                {/* Navigation Tabs */}
                <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('cheatsheet')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition ${
                      activeTab === 'cheatsheet'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Visual Cheatsheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('quiz')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition ${
                      activeTab === 'quiz'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Quiz ({studySet.questions.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition ${
                      activeTab === 'summary'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Summary</span>
                  </button>
                </div>

                {/* Tab Views */}
                {activeTab === 'cheatsheet' && (
                  <CheatsheetView
                    studySet={studySet}
                    onSeekVideo={handleSeekVideo}
                    onOpenExport={() => setExportModalOpen(true)}
                  />
                )}

                {activeTab === 'quiz' && (
                  <QuizInterface
                    questions={studySet.questions}
                    onSeekVideo={handleSeekVideo}
                    onQuizComplete={handleQuizComplete}
                    onSwitchToCheatsheet={() => setActiveTab('cheatsheet')}
                    onOpenExport={() => setExportModalOpen(true)}
                  />
                )}

                {activeTab === 'summary' && (
                  <SummaryNotes
                    studySet={studySet}
                    onSeekVideo={handleSeekVideo}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm py-8 mt-16 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span>QuizTube AI • Built with</span>
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
          <span>for students by</span>
          <a
            href="https://personal-portfolio-blue-eight-9p8guawbf5.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/80 dark:to-purple-950/80 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/90 dark:hover:to-purple-900/90 text-indigo-600 dark:text-indigo-300 font-bold rounded-xl border border-indigo-200/80 dark:border-indigo-800 shadow-sm transition hover:scale-105 group"
          >
            <span>Ashikur</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
        <p className="text-[11px] text-slate-400">
          Transform YouTube educational lectures into active recall quizzes, flashcards & visual cheatsheets
        </p>
      </footer>

      {/* Modals & Slide-out Drawers */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onKeySaved={() => setHasApiKey(Boolean(getStoredApiKey() || hasServerKey))}
        hasServerKey={hasServerKey}
      />

      <HistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        savedSets={savedSets}
        currentSetId={studySet?.id}
        isCloudConnected={isCloudConnected}
        onRefreshSets={() => {
          setSavedSets(getSavedStudySets());
        }}
        onSelectSet={set => {
          setStudySet(set);
          setActiveTab('cheatsheet');
        }}
        onDeleteSet={handleDeleteSavedSet}
      />

      {studySet && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          studySet={studySet}
        />
      )}
    </div>
  );
}
