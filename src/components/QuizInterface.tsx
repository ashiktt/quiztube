'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Flame,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  AlertCircle,
  Eye,
  Award,
} from 'lucide-react';
import { QuizQuestion, UserQuizAttempt } from '@/types';

interface QuizInterfaceProps {
  questions: QuizQuestion[];
  onSeekVideo: (seconds: number) => void;
  onQuizComplete?: (attempt: UserQuizAttempt) => void;
  onSwitchToCheatsheet?: () => void;
  onOpenExport?: () => void;
}

export function QuizInterface({
  questions,
  onSeekVideo,
  onQuizComplete,
  onSwitchToCheatsheet,
  onOpenExport,
}: QuizInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExamMode, setIsExamMode] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [filterIncorrectOnly, setFilterIncorrectOnly] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // Timer
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  // Questions to display (filter if reviewing incorrect)
  const displayQuestions = filterIncorrectOnly
    ? questions.filter(q => selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== q.correctIndex)
    : questions;

  const currentQuestion = displayQuestions[currentIndex] || questions[0];

  const handleSelectOption = (optionIndex: number) => {
    if (isCompleted && !isExamMode) return;
    // In practice mode, if already answered, don't change
    if (!isExamMode && selectedAnswers[currentQuestion.id] !== undefined) return;

    const newAnswers = {
      ...selectedAnswers,
      [currentQuestion.id]: optionIndex,
    };
    setSelectedAnswers(newAnswers);

    // Update streak in practice mode
    if (!isExamMode) {
      const isCorrect = optionIndex === currentQuestion.correctIndex;
      if (isCorrect) {
        setStreak(s => {
          const newStreak = s + 1;
          setMaxStreak(m => Math.max(m, newStreak));
          return newStreak;
        });
      } else {
        setStreak(0);
      }
    }
  };

  const handleCompleteQuiz = () => {
    setIsCompleted(true);

    // Calculate score
    let correctCount = 0;
    const topicMap: Record<string, { correct: number; total: number }> = {};

    questions.forEach(q => {
      const tag = q.topicTag || 'General';
      if (!topicMap[tag]) {
        topicMap[tag] = { correct: 0, total: 0 };
      }
      topicMap[tag].total += 1;

      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
        topicMap[tag].correct += 1;
      }
    });

    const percentage = Math.round((correctCount / questions.length) * 100);

    // Trigger celebration confetti for score >= 70%
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // confetti fallback
      }
    }

    const attempt: UserQuizAttempt = {
      score: correctCount,
      total: questions.length,
      percentage,
      completedAt: new Date().toISOString(),
      timeSpentSeconds: timerSeconds,
      selectedAnswers,
      topicMastery: topicMap,
    };

    if (onQuizComplete) {
      onQuizComplete(attempt);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setShowHint({});
    setIsCompleted(false);
    setFilterIncorrectOnly(false);
    setCurrentIndex(0);
    setTimerSeconds(0);
    setStreak(0);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const currentAnswer = selectedAnswers[currentQuestion?.id];
  const isCurrentAnswered = currentAnswer !== undefined;
  const isCurrentCorrect = isCurrentAnswered && currentAnswer === currentQuestion.correctIndex;

  // Calculate results if completed
  const correctCount = questions.filter(q => selectedAnswers[q.id] === q.correctIndex).length;
  const scorePercentage = Math.round((correctCount / questions.length) * 100);

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const optLetters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isCompleted || answeredCount > 0}
            onClick={() => setIsExamMode(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              !isExamMode
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${answeredCount > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            Practice Mode (Instant Feedback)
          </button>
          <button
            type="button"
            disabled={isCompleted || answeredCount > 0}
            onClick={() => setIsExamMode(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              isExamMode
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${answeredCount > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            Exam Mode (Test Simulation)
          </button>
        </div>

        {/* Stats: Timer, Streak, Progress */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{formatTime(timerSeconds)}</span>
          </div>

          {!isExamMode && streak > 1 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl animate-in zoom-in">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{streak}x Streak!</span>
            </div>
          )}

          <div className="text-slate-500 dark:text-slate-400 font-mono">
            {answeredCount} / {questions.length} Answered
          </div>
        </div>
      </div>

      {/* Completion View */}
      {isCompleted ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-in zoom-in-95 duration-200">
          {/* Trophy & Score Circle */}
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-3xl text-white shadow-xl shadow-amber-500/20">
              <Trophy className="w-12 h-12" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Assessment Completed!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {scorePercentage >= 80
                ? 'Outstanding performance! You have thoroughly mastered this lecture material.'
                : scorePercentage >= 60
                ? 'Great effort! Review the missed questions and timestamp explanations to reinforce weak areas.'
                : 'Good attempt! We recommend reviewing the lecture video at the highlighted timestamps.'}
            </p>

            <div className="flex justify-center items-center gap-6 pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center min-w-[120px]">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</span>
                <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {scorePercentage}%
                </p>
                <span className="text-xs text-slate-400">
                  {correctCount} of {questions.length} correct
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center min-w-[120px]">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Time Taken</span>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {formatTime(timerSeconds)}
                </p>
                <span className="text-xs text-slate-400">
                  {Math.round(timerSeconds / questions.length)}s per question
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-sm rounded-xl transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry All Questions</span>
            </button>

            {correctCount < questions.length && (
              <button
                onClick={() => {
                  setFilterIncorrectOnly(true);
                  setIsCompleted(false);
                  setCurrentIndex(0);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 font-semibold text-sm rounded-xl border border-red-200 dark:border-red-800 transition"
              >
                <XCircle className="w-4 h-4 text-red-500" />
                <span>Review Missed ({questions.length - correctCount})</span>
              </button>
            )}

            {onSwitchToCheatsheet && (
              <button
                onClick={onSwitchToCheatsheet}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 font-semibold text-sm rounded-xl shadow-md transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>View Visual Cheatsheet</span>
              </button>
            )}

            {onOpenExport && (
              <button
                onClick={onOpenExport}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white dark:bg-slate-700 hover:bg-slate-900 font-semibold text-sm rounded-xl transition"
              >
                <Award className="w-4 h-4" />
                <span>Export PDF / Study Sheet</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Active Question Card */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Question Nav Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {displayQuestions.map((q, idx) => {
              const ans = selectedAnswers[q.id];
              const isAns = ans !== undefined;
              const isCorr = isAns && ans === q.correctIndex;
              const isCurrent = idx === currentIndex;

              let pillStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
              if (!isExamMode && isAns) {
                pillStyle = isCorr
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300';
              } else if (isAns) {
                pillStyle = 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300';
              }

              if (isCurrent) {
                pillStyle += ' ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-900 font-bold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold transition shrink-0 ${pillStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Header: Tags & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800">
                {currentQuestion.topicTag || 'Core Concept'}
              </span>
              <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                {currentQuestion.difficulty}
              </span>
              {currentQuestion.bloomsLevel && (
                <span className="px-2.5 py-1 text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800">
                  {currentQuestion.bloomsLevel}
                </span>
              )}
            </div>

            {/* Jump to Lecture Button */}
            <button
              onClick={() => onSeekVideo(currentQuestion.timestampSeconds)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 rounded-xl transition group"
              title="Jump to where this concept is taught in the video"
            >
              <Play className="w-3.5 h-3.5 text-red-500 fill-red-500 group-hover:scale-110 transition-transform" />
              <span>Lecture at {currentQuestion.timestampFormatted}</span>
            </button>
          </div>

          {/* Question Text */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Question {currentIndex + 1} of {displayQuestions.length}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Options List */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((optionText, optIdx) => {
              const isSelected = currentAnswer === optIdx;
              const isCorrectOpt = optIdx === currentQuestion.correctIndex;
              const showResult = !isExamMode && isCurrentAnswered;

              let cardStyle =
                'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700';

              if (showResult) {
                if (isCorrectOpt) {
                  cardStyle =
                    'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500';
                } else if (isSelected) {
                  cardStyle =
                    'bg-red-50 dark:bg-red-950/50 border-red-500 text-red-900 dark:text-red-100 ring-1 ring-red-500';
                } else {
                  cardStyle = 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60';
                }
              } else if (isSelected) {
                cardStyle =
                  'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-100 ring-1 ring-indigo-500';
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={showResult}
                  className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-3.5 group ${cardStyle}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      showResult && isCorrectOpt
                        ? 'bg-emerald-500 text-white'
                        : showResult && isSelected
                        ? 'bg-red-500 text-white'
                        : isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-700'
                    }`}
                  >
                    {showResult && isCorrectOpt ? (
                      <Check className="w-4 h-4" />
                    ) : showResult && isSelected ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      optLetters[optIdx] || optIdx + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium leading-relaxed">{optionText}</p>
                    {showResult && currentQuestion.optionExplanations && currentQuestion.optionExplanations[optIdx] && (
                      <p className="text-xs mt-1.5 opacity-90 italic">
                        {currentQuestion.optionExplanations[optIdx]}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hint Section */}
          {currentQuestion.hint && !isCurrentAnswered && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() =>
                  setShowHint(h => ({ ...h, [currentQuestion.id]: !h[currentQuestion.id] }))
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>{showHint[currentQuestion.id] ? 'Hide Hint' : 'Need a hint?'}</span>
              </button>

              {showHint[currentQuestion.id] && (
                <div className="mt-2 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-200 animate-in fade-in">
                  <span className="font-bold">Hint: </span>
                  {currentQuestion.hint}
                </div>
              )}
            </div>
          )}

          {/* Practice Mode In-Depth Explanation Box */}
          {!isExamMode && isCurrentAnswered && (
            <div
              className={`p-5 rounded-2xl border text-xs sm:text-sm space-y-2 animate-in fade-in ${
                isCurrentCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  {isCurrentCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Correct Answer!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>Incorrect Choice</span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => onSeekVideo(currentQuestion.timestampSeconds)}
                  className="flex items-center gap-1 text-xs font-semibold underline text-slate-700 dark:text-slate-300"
                >
                  <Play className="w-3 h-3 text-red-500" />
                  <span>Re-watch explanation ({currentQuestion.timestampFormatted})</span>
                </button>
              </div>

              <p className="leading-relaxed opacity-95">
                <strong className="font-semibold">Explanation: </strong>
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Navigation & Submit Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < displayQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(i => Math.min(displayQuestions.length - 1, i + 1))}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteQuiz}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition"
              >
                <Check className="w-4 h-4" />
                <span>Submit & View Results</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
