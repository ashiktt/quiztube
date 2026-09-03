'use client';

import React, { useRef, useState } from 'react';
import {
  X,
  Trash2,
  BookOpen,
  Trophy,
  ArrowRight,
  Sparkles,
  FolderOpen,
  Cloud,
  HardDrive,
  Download,
  Upload,
  Lock,
  User,
  LogIn,
  CheckCircle2,
  FileText,
  FileQuestion,
} from 'lucide-react';
import { LectureStudySet, StudentUser, UniversitySolvedExam, TutorConversation } from '@/types';
import { exportStudyLibraryBackup, importStudyLibraryBackup } from '@/lib/storage';
import { YoutubeIcon } from '@/components/Icons';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedSets: LectureStudySet[];
  savedExams?: UniversitySolvedExam[];
  savedTutorConversations?: TutorConversation[];
  currentSetId?: string;
  isCloudConnected?: boolean;
  currentUser?: StudentUser | null;
  onOpenAuthModal?: () => void;
  onSelectSet: (set: LectureStudySet) => void;
  onDeleteSet: (id: string) => void;
  onSelectExam?: (exam: UniversitySolvedExam) => void;
  onDeleteExam?: (id: string) => void;
  onSelectTutorConversation?: (conv: TutorConversation) => void;
  onDeleteTutorConversation?: (id: string) => void;
  onRefreshSets?: () => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  savedSets,
  savedExams = [],
  savedTutorConversations = [],
  currentSetId,
  isCloudConnected = false,
  currentUser = null,
  onOpenAuthModal,
  onSelectSet,
  onDeleteSet,
  onSelectExam,
  onDeleteExam,
  onSelectTutorConversation,
  onDeleteTutorConversation,
  onRefreshSets,
}: HistoryDrawerProps) {
  const [tab, setTab] = useState<'lectures' | 'exams' | 'tutor'>('lectures');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const res = importStudyLibraryBackup(content);
        if (res.success) {
          alert(`Successfully imported ${res.count} study set(s) into your library!`);
          if (onRefreshSets) onRefreshSets();
        } else {
          alert('Invalid backup file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const totalSaved = savedSets.length + savedExams.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col pt-safe">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    My Study Library
                  </h2>
                  {currentUser && isCloudConnected ? (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <Cloud className="w-3 h-3" /> Cloud
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                      <HardDrive className="w-3 h-3" /> Local
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate max-w-[200px] sm:max-w-none">
                  {currentUser
                    ? `Logged in as ${currentUser.email || currentUser.fullName}`
                    : `${totalSaved} saved study resources`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector: Lectures vs Exams vs Tutor */}
          <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/40">
            <button
              type="button"
              onClick={() => setTab('lectures')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                tab === 'lectures'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <YoutubeIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Quizzes ({savedSets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('exams')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                tab === 'exams'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5 shrink-0" />
              <span>Exams ({savedExams.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('tutor')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                tab === 'tutor'
                  ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Tutor ({savedTutorConversations.length})</span>
            </button>
          </div>

          {/* Student Auth Notice if not signed in */}
          {!currentUser && (
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Student Login Recommended</span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  Sign in to save your quizzes & solved exams permanently to Supabase cloud.
                </p>
              </div>

              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal();
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition shrink-0 shadow-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {tab === 'lectures' ? (
              /* Lecture Quizzes List */
              savedSets.length === 0 ? (
                <div className="text-center py-16 space-y-3 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-medium">No saved lecture quizzes yet.</p>
                  <p className="text-xs text-slate-500">
                    Generate a quiz from any YouTube lecture to save it here!
                  </p>
                </div>
              ) : (
                savedSets.map(set => {
                  const isCurrent = set.id === currentSetId;
                  const latestAttempt = set.attempts && set.attempts[0];

                  return (
                    <div
                      key={set.id}
                      className={`p-4 rounded-2xl border transition group relative ${
                        isCurrent
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {set.thumbnailUrl ? (
                          <img
                            src={set.thumbnailUrl}
                            alt="Thumbnail"
                            className="w-20 h-14 object-cover rounded-xl shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-20 h-14 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                            <BookOpen className="w-6 h-6" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                            {set.videoTitle}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {set.channelTitle}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-500">
                            <span className="font-semibold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 uppercase">
                              {set.difficulty}
                            </span>
                            <span>{set.questions.length} Questions</span>
                            <span>•</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Visual Cheatsheet</span>
                          </div>
                        </div>
                      </div>

                      {/* Attempt score if available */}
                      {latestAttempt && (
                        <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            <span>Last Score:</span>
                          </span>
                          <span
                            className={`font-bold ${
                              latestAttempt.percentage >= 70
                                ? 'text-emerald-600'
                                : 'text-indigo-600'
                            }`}
                          >
                            {latestAttempt.percentage}% ({latestAttempt.score}/{latestAttempt.total})
                          </span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSet(set);
                            onClose();
                          }}
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <span>{isCurrent ? 'Currently Active' : 'Study This Lecture'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteSet(set.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="Delete from saved"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : tab === 'exams' ? (
              /* Solved Exam Papers List */
              savedExams.length === 0 ? (
                <div className="text-center py-16 space-y-3 text-slate-400">
                  <FileQuestion className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-medium">No solved exam papers yet.</p>
                  <p className="text-xs text-slate-500">
                    Use University Question Solver to solve exam questions and they will appear here!
                  </p>
                </div>
              ) : (
                savedExams.map(exam => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition group space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-md">
                            {exam.academicLevel}
                          </span>
                          <span className="px-2 py-0.5 font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-md">
                            {exam.totalMarks} Marks
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                          {exam.subject}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {exam.solutions.length} questions solved • {new Date(exam.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteExam && onDeleteExam(exam.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0"
                        title="Delete exam paper"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectExam) {
                            onSelectExam(exam);
                            onClose();
                          }
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        <span>Open Model Answers & PDF</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              /* AI Tutor Chats List */
              savedTutorConversations.length === 0 ? (
                <div className="text-center py-16 space-y-3 text-slate-400">
                  <Sparkles className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-medium">No saved AI Tutor sessions yet.</p>
                  <p className="text-xs text-slate-500">
                    Ask your first question in AI Tutor and it will be saved here automatically!
                  </p>
                </div>
              ) : (
                savedTutorConversations.map(conv => (
                  <div
                    key={conv.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition group space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 font-bold uppercase tracking-wider bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 rounded-md">
                            {conv.explanationMode || 'Step-by-Step'}
                          </span>
                          <span className="px-2 py-0.5 font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md">
                            {conv.messages.length} msgs
                          </span>
                          {conv.learningMode === 'socratic' && (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-md">
                              Socratic
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                          {conv.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString()} • {new Date(conv.updatedAt || conv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteTutorConversation && onDeleteTutorConversation(conv.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0"
                        title="Delete tutoring session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectTutorConversation) {
                            onSelectTutorConversation(conv);
                            onClose();
                          }
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline"
                      >
                        <span>Resume Tutoring Session</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          {/* Footer with Backup & Import */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>Import (.json)</span>
            </button>

            <button
              type="button"
              onClick={exportStudyLibraryBackup}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Backup (.json)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
