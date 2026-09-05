'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  FileText,
  Clock,
  Play,
  FileDown,
  ArrowLeft,
  ArrowRight,
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
  Download,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import {
  LectureStudySet,
  QuizGenerationRequest,
  UserQuizAttempt,
  StudentUser,
  UniversitySolvedExam,
  TutorConversation,
  TutorContext,
  QuizQuestion,
  UserUsageSummary,
} from '@/types';
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
import { AuthModal } from '@/components/AuthModal';
import { UniversityQuestionSolver } from '@/components/UniversityQuestionSolver';
import { AITutorView } from '@/components/AITutorView';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { ApkDownloadSection } from '@/components/ApkDownloadSection';
import { AccountSubscriptionView } from '@/components/AccountSubscriptionView';
import { LegalModals, LegalModalType } from '@/components/LegalModals';
import { Footer } from '@/components/Footer';
import { APK_CONFIG } from '@/config/apk';
import { SUBSCRIPTION_ENABLED } from '@/config/subscription';
import {
  getSavedStudySets,
  saveStudySet,
  deleteStudySet,
  saveQuizAttempt,
  getStoredApiKey,
  fetchAndMergeCloudStudySets,
  clearLocalStorageStudySets,
  getSavedSolvedExams,
  saveSolvedExam,
  deleteSolvedExam,
  fetchAndMergeCloudSolvedExams,
  getSavedTutorConversations,
  saveTutorConversation,
  deleteTutorConversation,
  fetchAndMergeCloudTutorConversations,
} from '@/lib/storage';
import { getCurrentStudent, signOutStudent, onAuthStateChange } from '@/lib/auth';
import { SAMPLE_STUDY_SET } from '@/lib/sampleData';

export default function Home() {
  const [studySet, setStudySet] = useState<LectureStudySet | null>(null);
  const [savedSets, setSavedSets] = useState<LectureStudySet[]>([]);
  const [savedExams, setSavedExams] = useState<UniversitySolvedExam[]>([]);
  const [activeSolvedExam, setActiveSolvedExam] = useState<UniversitySolvedExam | null>(null);
  const [savedTutorConversations, setSavedTutorConversations] = useState<TutorConversation[]>([]);
  const [activeTutorConversation, setActiveTutorConversation] = useState<TutorConversation | null>(null);
  const [tutorContext, setTutorContext] = useState<TutorContext | null>(null);
  const [activeTab, setActiveTab] = useState<'cheatsheet' | 'quiz' | 'summary'>('cheatsheet');
  const [appMode, setAppMode] = useState<'youtube' | 'examSolver' | 'tutor'>('youtube');
  const [currentVideoTimestamp, setCurrentVideoTimestamp] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);

  // Subscription & Daily AI Quota State
  const [userUsage, setUserUsage] = useState<UserUsageSummary | null>(null);
  const [isPro, setIsPro] = useState(false);

  // Modals & Drawers
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [apkModalOpen, setApkModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalModalType>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);

  // Fetch live usage & subscription status
  const refreshUserUsage = useCallback(async (userId?: string, userEmail?: string) => {
    try {
      const targetUserId = userId ?? currentUser?.id;
      const targetEmail = userEmail ?? currentUser?.email;
      const params = new URLSearchParams();
      if (targetUserId) params.set('userId', targetUserId);
      if (targetEmail) params.set('email', targetEmail);

      const url = `/api/user/usage${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setUserUsage(data);
        setIsPro(Boolean(data.isPro));
      }
    } catch (err) {
      console.warn('Failed to fetch user usage/quota summary:', err);
    }
  }, [currentUser?.id, currentUser?.email]);

  // Initial load & Supabase sync
  useEffect(() => {
    const initialSets = getSavedStudySets();
    setSavedSets(initialSets);
    const initialExams = getSavedSolvedExams();
    setSavedExams(initialExams);
    const initialTutorConvs = getSavedTutorConversations();
    setSavedTutorConversations(initialTutorConvs);
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

    // Check current student auth
    getCurrentStudent().then(student => {
      setCurrentUser(student);
      if (student) {
        refreshUserUsage(student.id, student.email);
        fetchAndMergeCloudStudySets(student.id).then(({ sets, isCloudConnected }) => {
          setSavedSets(sets);
          setIsCloudConnected(isCloudConnected);
        });
        fetchAndMergeCloudSolvedExams(student.id).then(({ exams }) => {
          setSavedExams(exams);
        });
        fetchAndMergeCloudTutorConversations(student.id).then(({ conversations }) => {
          setSavedTutorConversations(conversations);
        });
      } else {
        refreshUserUsage();
      }
    });

    // Listen for auth changes
    const unsubscribe = onAuthStateChange(student => {
      setCurrentUser(student);
      if (student) {
        refreshUserUsage(student.id, student.email);
        fetchAndMergeCloudStudySets(student.id).then(({ sets, isCloudConnected }) => {
          setSavedSets(sets);
          setIsCloudConnected(isCloudConnected);
        });
        fetchAndMergeCloudSolvedExams(student.id).then(({ exams }) => {
          setSavedExams(exams);
        });
        fetchAndMergeCloudTutorConversations(student.id).then(({ conversations }) => {
          setSavedTutorConversations(conversations);
        });
      } else {
        refreshUserUsage();
        clearLocalStorageStudySets();
        setSavedSets([SAMPLE_STUDY_SET]);
        setSavedExams([]);
        setSavedTutorConversations([]);
        setActiveSolvedExam(null);
        setActiveTutorConversation(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshUserUsage]);

  const handleSignOut = async () => {
    await signOutStudent();
    setCurrentUser(null);
    setIsPro(false);
    setUserUsage(null);
    clearLocalStorageStudySets();
    setSavedSets([SAMPLE_STUDY_SET]);
    setSavedExams([]);
    setSavedTutorConversations([]);
    setActiveSolvedExam(null);
    setActiveTutorConversation(null);
    refreshUserUsage();
  };

  const handleAskTutorFromQuiz = (question: QuizQuestion, selectedOptionIndex?: number) => {
    const context: TutorContext = {
      type: 'mistake',
      lectureTitle: studySet?.videoTitle || 'Lecture Quiz',
      videoId: studySet?.videoId,
      videoUrl: studySet?.videoUrl,
      timestampSeconds: question.timestampSeconds,
      timestampFormatted: question.timestampFormatted,
      questionText: question.question,
      options: question.options,
      correctAnswer: question.options[question.correctIndex],
      studentSelectedAnswer: selectedOptionIndex !== undefined ? question.options[selectedOptionIndex] : undefined,
      explanation: question.explanation,
      topicTag: question.topicTag || 'Quiz Question',
    };
    setTutorContext(context);
    setActiveTutorConversation(null);
    setAppMode('tutor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskTutorFromCheatsheet = (context: TutorContext) => {
    setTutorContext(context);
    setActiveTutorConversation(null);
    setAppMode('tutor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateQuiz = async (request: QuizGenerationRequest) => {
    setIsGenerating(true);
    try {
      const storedKey = getStoredApiKey();
      const payload: QuizGenerationRequest = {
        ...request,
        apiKey: storedKey || undefined,
        userId: currentUser?.id,
        userEmail: currentUser?.email,
      };

      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (SUBSCRIPTION_ENABLED && (data?.limitReached || data?.proRequired)) {
          setProModalOpen(true);
        }
        if (data?.error?.includes('Gemini API key is required')) {
          setApiKeyModalOpen(true);
        }
        throw new Error(data?.error || 'Failed to generate quiz.');
      }

      const newStudySet: LectureStudySet = {
        ...data.studySet,
        userId: currentUser?.id,
      };
      setStudySet(newStudySet);
      saveStudySet(newStudySet);
      setSavedSets(getSavedStudySets());
      setActiveTab('cheatsheet');
      refreshUserUsage(currentUser?.id, currentUser?.email);
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
        onNewQuiz={() => {
          setStudySet(null);
          setActiveSolvedExam(null);
          setActiveTutorConversation(null);
          setTutorContext(null);
          setAppMode('youtube');
        }}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenUpgradeModal={() => setProModalOpen(true)}
        onOpenApkModal={() => setApkModalOpen(true)}
        onOpenAccountModal={() => setAccountModalOpen(true)}
        currentUser={currentUser}
        savedCount={savedSets.length + savedExams.length + savedTutorConversations.length}
        hasApiKey={hasApiKey}
        isPro={isPro}
        appMode={appMode}
        onSwitchMode={mode => {
          if (mode === 'youtube') {
            setActiveSolvedExam(null);
          }
          setAppMode(mode);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8 space-y-6 sm:space-y-8">
        {appMode === 'tutor' ? (
          /* AI Tutor Interactive Chat Mode */
          <AITutorView
            initialContext={tutorContext}
            onClearContext={() => setTutorContext(null)}
            onBackToStudy={() => {
              if (studySet) {
                setAppMode('youtube');
              } else if (activeSolvedExam) {
                setAppMode('examSolver');
              } else {
                setAppMode('youtube');
              }
            }}
            userId={currentUser?.id}
            userEmail={currentUser?.email}
            hasServerKey={hasServerKey}
            onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
            activeConversation={activeTutorConversation}
            onConversationUpdated={() => setSavedTutorConversations(getSavedTutorConversations())}
            isPro={isPro}
            onOpenUpgradeModal={() => setProModalOpen(true)}
            onPracticeTopic={topic => {
              setAppMode('youtube');
              setStudySet(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : appMode === 'examSolver' ? (
          /* University Question Solver Mode */
          <UniversityQuestionSolver
            onBackToYouTube={() => {
              setActiveSolvedExam(null);
              setAppMode('youtube');
            }}
            apiKey={getStoredApiKey()}
            hasServerKey={hasServerKey}
            onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
            userId={currentUser?.id}
            userEmail={currentUser?.email}
            activeSolvedExam={activeSolvedExam}
            onExamSolved={() => setSavedExams(getSavedSolvedExams())}
            usageSummary={userUsage}
            isPro={isPro}
            onOpenUpgradeModal={() => setProModalOpen(true)}
            onQuotaUsed={() => refreshUserUsage(currentUser?.id, currentUser?.email)}
          />
        ) : !studySet ? (
          /* Landing / Input Screen */
          <div className="space-y-8">
            {/* Top Feature Switcher Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. University Solver Banner Card */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl text-white shadow-xl flex flex-col justify-between gap-4 border border-indigo-500/30">
                <div className="flex items-start gap-3 text-left">
                  <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl text-white shadow-md shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs sm:text-sm">
                        Advanced Question Solver
                      </h4>
                    </div>
                    <p className="text-[11px] text-indigo-200 mt-1 leading-relaxed">
                      Generate structured model answers (2, 5, 10, 15 M) with Mermaid diagrams and export PDF booklets.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAppMode('examSolver')}
                  className="w-full py-2 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>Launch Question Solver</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 2. AI Tutor Banner Card */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 via-pink-900 to-slate-900 rounded-3xl text-white shadow-xl flex flex-col justify-between gap-4 border border-purple-500/30">
                <div className="flex items-start gap-3 text-left">
                  <div className="p-2.5 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-2xl text-white shadow-md shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs sm:text-sm">
                        QuizTube AI Tutor
                      </h4>
                      {SUBSCRIPTION_ENABLED && isPro && (
                        <span className="px-1.5 py-0.2 text-[8px] font-extrabold uppercase bg-pink-400 text-pink-950 rounded-full">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-pink-200 mt-1 leading-relaxed">
                      Socratic learning mode, mistake diagnosis, step-by-step logic derivations, and voice chat.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTutorContext(null);
                    setActiveTutorConversation(null);
                    setAppMode('tutor');
                  }}
                  className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>Chat with AI Tutor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3. Android APK Download Banner */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-3xl text-white shadow-xl flex flex-col justify-between gap-4 border border-emerald-500/30">
                <div className="flex items-start gap-3 text-left">
                  <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl text-white shadow-md shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs sm:text-sm">
                        QuizTube for Android
                      </h4>
                      <span className="px-1.5 py-0.2 text-[8px] font-extrabold uppercase bg-emerald-400 text-emerald-950 rounded-full">
                        v{APK_CONFIG.version}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-200 mt-1 leading-relaxed">
                      Direct APK download with offline review, full screen lectures, and real-time cloud sync.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setApkModalOpen(true)}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download APK ({APK_CONFIG.fileSize})</span>
                </button>
              </div>
            </div>

            <LectureInput
              onGenerate={handleGenerateQuiz}
              isLoading={isGenerating}
              onLoadSample={handleLoadSample}
              usageSummary={userUsage}
              isPro={isPro}
              onOpenUpgradeModal={() => setProModalOpen(true)}
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
                    onAskTutor={handleAskTutorFromCheatsheet}
                  />
                )}

                {activeTab === 'quiz' && (
                  <QuizInterface
                    questions={studySet.questions}
                    onSeekVideo={handleSeekVideo}
                    onQuizComplete={handleQuizComplete}
                    onSwitchToCheatsheet={() => setActiveTab('cheatsheet')}
                    onOpenExport={() => setExportModalOpen(true)}
                    onAskTutor={handleAskTutorFromQuiz}
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
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm py-8 mt-12 mb-16 sm:mb-0 text-center text-xs text-slate-500 dark:text-slate-400 space-y-4">
        {/* Policy & APK Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <button
            onClick={() => setApkModalOpen(true)}
            className="text-emerald-500 hover:text-emerald-400 font-semibold flex items-center gap-1 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Android APK</span>
          </button>
          <span>&middot;</span>
          <button
            onClick={() => setLegalModalType('terms')}
            className="hover:text-indigo-400 transition"
          >
            Terms of Service
          </button>
          <span>&middot;</span>
          <button
            onClick={() => setLegalModalType('privacy')}
            className="hover:text-indigo-400 transition"
          >
            Privacy Policy
          </button>
          <span>&middot;</span>
          <button
            onClick={() => setLegalModalType('refund')}
            className="hover:text-indigo-400 transition"
          >
            30-Day Pro & Refund Policy
          </button>
        </div>

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

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={user => {
          setCurrentUser(user);
          refreshUserUsage(user.id, user.email);
          fetchAndMergeCloudStudySets(user.id).then(({ sets, isCloudConnected }) => {
            setSavedSets(sets);
            setIsCloudConnected(isCloudConnected);
          });
          fetchAndMergeCloudSolvedExams(user.id).then(({ exams }) => {
            setSavedExams(exams);
          });
          fetchAndMergeCloudTutorConversations(user.id).then(({ conversations }) => {
            setSavedTutorConversations(conversations);
          });
        }}
      />

      <HistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        savedSets={savedSets}
        savedExams={savedExams}
        savedTutorConversations={savedTutorConversations}
        currentSetId={studySet?.id}
        isCloudConnected={isCloudConnected}
        currentUser={currentUser}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onRefreshSets={() => {
          setSavedSets(getSavedStudySets());
          setSavedExams(getSavedSolvedExams());
          setSavedTutorConversations(getSavedTutorConversations());
        }}
        onSelectSet={set => {
          setStudySet(set);
          setActiveSolvedExam(null);
          setActiveTutorConversation(null);
          setAppMode('youtube');
          setActiveTab('cheatsheet');
        }}
        onDeleteSet={handleDeleteSavedSet}
        onSelectExam={exam => {
          setActiveSolvedExam(exam);
          setActiveTutorConversation(null);
          setAppMode('examSolver');
        }}
        onDeleteExam={id => {
          deleteSolvedExam(id);
          setSavedExams(getSavedSolvedExams());
          if (activeSolvedExam?.id === id) {
            setActiveSolvedExam(null);
          }
        }}
        onSelectTutorConversation={conv => {
          setActiveTutorConversation(conv);
          setTutorContext(conv.context || null);
          setAppMode('tutor');
        }}
        onDeleteTutorConversation={id => {
          deleteTutorConversation(id);
          setSavedTutorConversations(getSavedTutorConversations());
          if (activeTutorConversation?.id === id) {
            setActiveTutorConversation(null);
          }
        }}
      />

      {/* QuizTube Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={proModalOpen}
        onClose={() => setProModalOpen(false)}
        user={currentUser}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onUpgradeSuccess={() => {
          refreshUserUsage();
        }}
      />

      {/* Android APK Download Modal */}
      <ApkDownloadSection
        isOpen={apkModalOpen}
        onClose={() => setApkModalOpen(false)}
      />

      {/* Account & Subscription Dashboard View */}
      {accountModalOpen && (
        <AccountSubscriptionView
          user={currentUser}
          usageSummary={userUsage}
          isPro={isPro}
          onOpenUpgradeModal={() => setProModalOpen(true)}
          onOpenApkModal={() => setApkModalOpen(true)}
          onOpenLegalModal={type => setLegalModalType(type)}
          onLogout={handleSignOut}
          onClose={() => setAccountModalOpen(false)}
        />
      )}

      {/* Legal & Policy Modals */}
      <LegalModals
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {studySet && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          studySet={studySet}
        />
      )}

      {/* Professional Responsive Footer */}
      <Footer
        onSwitchMode={(mode) => {
          if (mode === 'youtube') {
            setActiveSolvedExam(null);
          }
          setAppMode(mode);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenHistory={() => setHistoryDrawerOpen(true)}
        onOpenApkModal={() => setApkModalOpen(true)}
        onOpenLegalModal={(type) => setLegalModalType(type)}
      />
    </div>
  );
}

