'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  MapPin,
  ListTodo,
  Bell,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { ExtractedEventProposal, ProposedReminder } from '@/types/assistant';

interface EventReviewCardProps {
  proposal: ExtractedEventProposal;
  isSubmitting?: boolean;
  onConfirm: (finalProposal: ExtractedEventProposal) => void;
  onReject: () => void;
  onEditProposal: (updated: ExtractedEventProposal) => void;
}

export function EventReviewCard({
  proposal,
  isSubmitting = false,
  onConfirm,
  onReject,
  onEditProposal,
}: EventReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(proposal.title);
  const [editedDescription, setEditedDescription] = useState(proposal.description);
  const [editedStartAt, setEditedStartAt] = useState(
    proposal.startAt ? proposal.startAt.slice(0, 16) : ''
  );
  const [editedLocation, setEditedLocation] = useState(proposal.location || '');
  const [newTaskInput, setNewTaskInput] = useState('');

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    const updated = {
      ...proposal,
      tasks: [...proposal.tasks, newTaskInput.trim()],
    };
    onEditProposal(updated);
    setNewTaskInput('');
  };

  const handleRemoveTask = (idx: number) => {
    const updated = {
      ...proposal,
      tasks: proposal.tasks.filter((_, i) => i !== idx),
    };
    onEditProposal(updated);
  };

  const handleAddReminder = (offsetMinutes: number) => {
    if (proposal.proposedReminders.some((r) => r.offsetMinutes === offsetMinutes)) return;
    const updated = {
      ...proposal,
      proposedReminders: [...proposal.proposedReminders, { offsetMinutes, channel: 'in_app' as const }],
    };
    onEditProposal(updated);
  };

  const handleRemoveReminder = (idx: number) => {
    const updated = {
      ...proposal,
      proposedReminders: proposal.proposedReminders.filter((_, i) => i !== idx),
    };
    onEditProposal(updated);
  };

  const handleSaveEdits = () => {
    const updated: ExtractedEventProposal = {
      ...proposal,
      title: editedTitle.trim() || proposal.title,
      description: editedDescription.trim(),
      startAt: editedStartAt ? new Date(editedStartAt).toISOString() : proposal.startAt,
      location: editedLocation.trim() || null,
      needsConfirmation: false,
      missingFields: [],
      clarificationPrompt: null,
    };
    onEditProposal(updated);
    setIsEditing(false);
  };

  const formatOffsetLabel = (mins: number) => {
    if (mins >= 1440) {
      const days = Math.round(mins / 1440);
      return `${days} day${days > 1 ? 's' : ''} before`;
    }
    if (mins >= 60) {
      const hours = Math.round(mins / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} before`;
    }
    return `${mins} minutes before`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 rounded-3xl p-5 sm:p-6 shadow-xl shadow-indigo-500/5 transition-all">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-2xl shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800">
                {proposal.eventType.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                AI Confidence: {Math.round(proposal.confidence * 100)}%
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Extracted Event Proposal
            </h3>
          </div>
        </div>

        {/* Workflow state pill */}
        <div className="flex items-center gap-2">
          {proposal.needsConfirmation ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Needs Confirmation</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Draft Proposal</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl transition"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Details'}
          </button>
        </div>
      </div>

      {/* Clarification Alert if ambiguous */}
      {proposal.needsConfirmation && proposal.clarificationPrompt && (
        <div className="mt-4 p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-900 dark:text-amber-200">
              Ambiguous Details Detected
            </p>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5">
              {proposal.clarificationPrompt}
            </p>
            {proposal.missingFields.length > 0 && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-mono">
                Missing: {proposal.missingFields.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div className="py-4 space-y-4">
        {isEditing ? (
          /* Inline Editor Form */
          <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Event Title
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date & Time ({proposal.timezone})
                </label>
                <input
                  type="datetime-local"
                  value={editedStartAt}
                  onChange={(e) => setEditedStartAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Hall / Link
                </label>
                <input
                  type="text"
                  value={editedLocation}
                  onChange={(e) => setEditedLocation(e.target.value)}
                  placeholder="e.g. Hall 4B or Zoom Link"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description / Syllabus
              </label>
              <textarea
                rows={2}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdits}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
              >
                Apply Changes
              </button>
            </div>
          </div>
        ) : (
          /* Read-only view */
          <div>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {proposal.title}
            </h4>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>
                  {proposal.startAt ? new Date(proposal.startAt).toLocaleString() : 'Date missing'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({proposal.timezone})</span>
              </div>

              {proposal.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  <span>{proposal.location}</span>
                </div>
              )}
            </div>

            {proposal.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                {proposal.description}
              </p>
            )}
          </div>
        )}

        {/* Tasks & Topics Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ListTodo className="w-4 h-4 text-indigo-500" />
              <span>Extracted Study Tasks & Topics ({proposal.tasks.length})</span>
            </span>
          </div>

          <div className="space-y-1.5">
            {proposal.tasks.map((task, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs group"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">{task}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTask(idx)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
                  title="Remove task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Quick add task input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
                placeholder="Add another study topic or subtask..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTask}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Proposed Reminders Section */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Proposed Reminders ({proposal.proposedReminders.length})</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {proposal.proposedReminders.map((rem, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-medium border border-amber-200 dark:border-amber-800/60"
              >
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{formatOffsetLabel(rem.offsetMinutes)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveReminder(idx)}
                  className="hover:text-red-500 ml-1"
                >
                  &times;
                </button>
              </span>
            ))}

            {/* Quick reminder presets */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[11px]">+ Add:</span>
              <button
                type="button"
                onClick={() => handleAddReminder(1440)}
                className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-400 text-slate-600 dark:text-slate-300"
              >
                1 Day
              </button>
              <button
                type="button"
                onClick={() => handleAddReminder(180)}
                className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-400 text-slate-600 dark:text-slate-300"
              >
                3 Hours
              </button>
              <button
                type="button"
                onClick={() => handleAddReminder(60)}
                className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-400 text-slate-600 dark:text-slate-300"
              >
                1 Hour
              </button>
            </div>
          </div>
        </div>

        {/* Study Plan Suggestions (if present) */}
        {proposal.studyPlanSuggestions && proposal.studyPlanSuggestions.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Recommended Study Revision Blocks</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {proposal.studyPlanSuggestions.map((plan, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200/60 dark:border-purple-900/40 text-xs"
                >
                  <p className="font-bold text-purple-900 dark:text-purple-200 truncate">
                    {plan.topic}
                  </p>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                    Target: {plan.suggestedDate} &bull; {plan.durationMinutes} mins
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer: Confirm & Reject buttons */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>No external side effect executes until you explicitly confirm.</span>
        </p>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onReject}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 rounded-xl border border-slate-200 dark:border-slate-800 transition"
          >
            Reject Proposal
          </button>

          <button
            type="button"
            onClick={() => onConfirm(proposal)}
            disabled={isSubmitting || proposal.needsConfirmation}
            className="flex-1 sm:flex-initial px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 active:scale-95"
          >
            {isSubmitting ? (
              <span>Scheduling...</span>
            ) : (
              <>
                <span>Confirm & Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
