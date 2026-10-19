'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  CheckSquare,
  Square,
  Trash2,
  Flame,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Bell,
  MapPin,
} from 'lucide-react';
import {
  AcademicEventType,
  PlannerOverview,
} from '@/types/assistant';

interface PlannerViewProps {
  planner: PlannerOverview | null;
  isLoading: boolean;
  onToggleTask: (taskId: string, currentStatus: string) => void;
  onCancelEvent: (eventId: string) => void;
  onRefresh: () => void;
  onGenerateStudyPlan?: (eventId?: string) => void;
}

export function PlannerView({
  planner,
  isLoading,
  onToggleTask,
  onCancelEvent,
  onGenerateStudyPlan,
}: PlannerViewProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | AcademicEventType>('all');
  const [selectedEventForPlan, setSelectedEventForPlan] = useState<string>('');

  if (isLoading && !planner) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading your student planner...</p>
      </div>
    );
  }

  const stats = planner?.stats || {
    totalActiveEvents: 0,
    pendingTasksCount: 0,
    upcomingRemindersCount: 0,
    completionRatePercent: 100,
  };

  const filteredExams = (planner?.upcomingExams || []).filter(
    (e) => typeFilter === 'all' || e.eventType === typeFilter
  );

  const filteredAssignments = (planner?.upcomingAssignments || []).filter(
    (a) => typeFilter === 'all' || a.eventType === typeFilter
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Stats Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Events
            </span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalActiveEvents}
          </p>
          <span className="text-[10px] text-slate-400">Exams & schedules</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Tasks
            </span>
            <CheckSquare className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.pendingTasksCount}
          </p>
          <span className="text-[10px] text-slate-400">Study checkpoints</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Upcoming Alerts
            </span>
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.upcomingRemindersCount}
          </p>
          <span className="text-[10px] text-slate-400">Scheduled reminders</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Completion Rate
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.completionRatePercent}%
          </p>
          <span className="text-[10px] text-slate-400">Weekly progress</span>
        </div>
      </div>

      {/* 2. Overdue Tasks Alert (if any) */}
      {planner?.overdueTasks && planner.overdueTasks.length > 0 && (
        <div className="p-4 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Overdue Study Tasks ({planner.overdueTasks.length})</span>
          </div>
          <div className="space-y-1.5">
            {planner.overdueTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 bg-white/80 dark:bg-slate-900/80 rounded-xl text-xs border border-rose-200/60 dark:border-rose-900/40"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id, task.status)}
                    className="text-slate-400 hover:text-emerald-500"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-slate-900 dark:text-white line-through opacity-80">
                    {task.title}
                  </span>
                </div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-bold">
                  Past Due
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Study Plan Suggestion Generator Card */}
      {planner?.upcomingExams && planner.upcomingExams.length > 0 && onGenerateStudyPlan && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 rounded-3xl text-white shadow-lg border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl text-white shadow-md shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base">
                Smart Study Revision Planner
              </h4>
              <p className="text-xs text-indigo-200 mt-0.5 leading-relaxed">
                Generate a distributed daily revision roadmap leading up to your confirmed examinations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedEventForPlan}
              onChange={(e) => setSelectedEventForPlan(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-800 text-white border border-indigo-400/30 focus:outline-none"
            >
              <option value="">Select Target Exam</option>
              {planner.upcomingExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onGenerateStudyPlan(selectedEventForPlan || undefined)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <span>Generate Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Split Two-Column Grid: Today's Tasks vs Upcoming Commitments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's Tasks */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Today&apos;s Focus Tasks
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {planner?.todayTasks?.length || 0} scheduled
            </span>
          </div>

          {(!planner?.todayTasks || planner.todayTasks.length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto" />
              <p className="font-medium">All caught up for today!</p>
              <p className="text-[11px] text-slate-500">
                Check upcoming exam dates or add new study checkpoints.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {planner.todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs transition hover:border-indigo-300"
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id, task.status)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-600 transition"
                    >
                      {task.status === 'completed' ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <p
                        className={`font-semibold text-slate-800 dark:text-slate-200 ${
                          task.status === 'completed' ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.estimatedMinutes && (
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          ~{task.estimatedMinutes} mins
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                      task.priority === 'high'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Exams & Deadlines */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Upcoming Academic Commitments
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1">
              {(['all', 'exam', 'assignment'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTypeFilter(mode)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition ${
                    typeFilter === mode
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {filteredExams.length === 0 && filteredAssignments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 text-indigo-400/40 mx-auto" />
              <p className="font-medium">No upcoming academic events scheduled yet.</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Paste college notices, exam dates, or syllabi in the assistant to schedule events automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...filteredExams, ...filteredAssignments].map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {event.eventType}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {event.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {event.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => onCancelEvent(event.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition"
                      title="Cancel event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {new Date(event.startAt).toLocaleString()}
                    </span>

                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-500" />
                        {event.location}
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
