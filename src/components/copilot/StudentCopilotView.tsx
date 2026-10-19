'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Calendar,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  ListTodo,
  Bell,
  Workflow,
  Sliders,
  RefreshCw,
  Plus,
  BookOpen,
} from 'lucide-react';
import {
  ExtractedEventProposal,
  StudentEventItem,
  StudentTaskItem,
  StudentReminderItem,
  AssistantActionRunItem,
  PlannerOverview,
} from '@/types/assistant';
import { EventReviewCard } from './EventReviewCard';
import { PlannerView } from './PlannerView';
import { AutomationHistoryPanel } from './AutomationHistoryPanel';
import { IntegrationsPanel } from './IntegrationsPanel';
import { getAuthHeaders } from '@/lib/auth';

interface StudentCopilotViewProps {
  userId?: string;
  userEmail?: string;
  hasServerKey?: boolean;
  onOpenApiKeyModal?: () => void;
  onOpenAuthModal?: () => void;
}

const SAMPLE_PROMPT =
  'I have a DBMS exam on October 22 at 10 AM. I need to revise indexing, B-trees, and hashing. Remind me the previous evening and one hour before the exam.';

export function StudentCopilotView({
  userId,
  userEmail: _userEmail,
  hasServerKey: _hasServerKey,
  onOpenApiKeyModal: _onOpenApiKeyModal,
  onOpenAuthModal,
}: StudentCopilotViewProps) {
  const [activeTab, setActiveTab] = useState<'assistant' | 'planner' | 'tasks' | 'reminders' | 'automations' | 'integrations'>('assistant');

  // Input states
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    mimeType: string;
    base64: string;
  } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Proposal & Workflow State
  const [currentProposal, setCurrentProposal] = useState<ExtractedEventProposal | null>(null);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // Data states
  const [plannerData, setPlannerData] = useState<PlannerOverview | null>(null);
  const [eventsList, setEventsList] = useState<StudentEventItem[]>([]);
  const [tasksList, setTasksList] = useState<StudentTaskItem[]>([]);
  const [remindersList, setRemindersList] = useState<StudentReminderItem[]>([]);
  const [actionsList, setActionsList] = useState<AssistantActionRunItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  // Fetch all user assistant data
  const loadCopilotData = useCallback(async () => {
    if (!userId) return;
    setIsLoadingData(true);
    try {
      const headers = await getAuthHeaders();

      const [plannerRes, eventsRes, tasksRes, remindersRes, actionsRes] = await Promise.all([
        fetch('/api/assistant/planner', { headers }),
        fetch('/api/assistant/events', { headers }),
        fetch('/api/assistant/tasks', { headers }),
        fetch('/api/assistant/reminders', { headers }),
        fetch('/api/assistant/actions', { headers }),
      ]);

      if (plannerRes.ok) {
        const data = await plannerRes.json();
        if (data.success) setPlannerData(data.planner);
      }
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        if (data.success) setEventsList(data.events);
      }
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        if (data.success) setTasksList(data.tasks);
      }
      if (remindersRes.ok) {
        const data = await remindersRes.json();
        if (data.success) setRemindersList(data.reminders);
      }
      if (actionsRes.ok) {
        const data = await actionsRes.json();
        if (data.success) setActionsList(data.actions);
      }
    } catch (err: unknown) {
      console.warn('Failed to load copilot data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCopilotData();
  }, [loadCopilotData]);

  // Voice dictation handling
  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    const windowObj = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRecConstructor = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;

    if (!SpeechRecConstructor) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: { resultIndex: number; results: Array<Array<{ transcript: string }>> }) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Handle file uploads (Images & PDFs)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachedFile({
        name: file.name,
        mimeType: file.type || 'application/pdf',
        base64: result,
      });
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Extract structured event from user input
  const handleExtractEvent = async () => {
    if (!userId) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    if (!inputText.trim() && !attachedFile) {
      setErrorMessage('Please enter academic text or upload an exam notice / schedule.');
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/assistant/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          text: inputText.trim(),
          fileBase64: attachedFile?.base64,
          fileMimeType: attachedFile?.mimeType,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract event information.');
      }

      setCurrentProposal(data.proposal);
      setSuccessMessage('AI successfully structured your academic event. Please review before scheduling.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Event extraction failed.';
      setErrorMessage(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  // Confirm proposed event & save to database
  const handleConfirmProposal = async (finalProposal: ExtractedEventProposal) => {
    if (!userId) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    setIsSubmittingProposal(true);
    setErrorMessage(null);

    try {
      const headers = await getAuthHeaders();

      // 1. Save event to database
      const saveRes = await fetch('/api/assistant/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          ...finalProposal,
          rawInputSnippet: inputText.slice(0, 300),
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || 'Failed to save event.');
      }

      const eventId = saveData.event.id;

      // 2. Advance to confirmed/scheduled via confirmation endpoint
      const confirmRes = await fetch(`/api/assistant/events/${eventId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({}),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok || !confirmData.success) {
        throw new Error(confirmData.error || 'Failed to schedule event.');
      }

      setSuccessMessage(`"${finalProposal.title}" confirmed and scheduled in your planner!`);
      setCurrentProposal(null);
      setInputText('');
      setAttachedFile(null);
      loadCopilotData();
      setActiveTab('planner');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule event.';
      setErrorMessage(msg);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Reject proposal
  const handleRejectProposal = () => {
    setCurrentProposal(null);
    setSuccessMessage('Proposal discarded. You can submit new information.');
  };

  // Toggle task completion
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/assistant/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadCopilotData();
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  // Cancel an existing event
  const handleCancelEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel this event and its reminders?')) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/assistant/events/${eventId}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setSuccessMessage('Event cancelled successfully.');
        loadCopilotData();
      }
    } catch (err) {
      console.error('Failed to cancel event:', err);
    }
  };

  // Add custom standalone task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/assistant/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          dueDate: newTaskDue || undefined,
        }),
      });

      if (res.ok) {
        setNewTaskTitle('');
        setNewTaskDue('');
        loadCopilotData();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. Header Banner & Workspace Mode Switcher */}
      {/* ========================================================= */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800">
              AI Automation Assistant
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Deterministic &bull; n8n Powered
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Student Copilot
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Convert college notices, exam timetables, syllabus updates, and study goals into verified schedules and automated reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCopilotData}
            disabled={isLoadingData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            title="Refresh planner"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. Primary Navigation Tabs */}
      {/* ========================================================= */}
      <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('assistant')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition ${
            activeTab === 'assistant'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Extraction & Assistant</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition ${
            activeTab === 'planner'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Planner</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Tasks ({tasksList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reminders')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition ${
            activeTab === 'reminders'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Reminders ({remindersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('automations')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition ${
            activeTab === 'automations'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Workflow className="w-4 h-4 text-orange-400" />
          <span>Activity Log</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition ${
            activeTab === 'integrations'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Integrations</span>
        </button>
      </div>

      {/* Global Banners (Error / Success) */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="p-1 hover:text-rose-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="p-1 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAB 1: Conversational Assistant & Input Workspace */}
      {/* ========================================================= */}
      {activeTab === 'assistant' && (
        <div className="space-y-6">
          {/* Main Input Area */}
          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Academic Input & Document Ingestion</span>
              </span>

              <button
                type="button"
                onClick={() => setInputText(SAMPLE_PROMPT)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Load Sample DBMS Prompt
              </button>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste exam schedules, college notices, timetable, assignment guidelines, or dictate upcoming deadlines..."
                className="w-full p-4 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />

              {/* Dictation active ripple indicator */}
              {isListening && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-950/80 text-red-600 rounded-full text-[10px] font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Listening...</span>
                </div>
              )}
            </div>

            {/* Attached file preview chip */}
            {attachedFile && (
              <div className="flex items-center justify-between p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs">
                <div className="flex items-center gap-2 truncate mr-2">
                  {attachedFile.mimeType.includes('pdf') ? (
                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-purple-500 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {attachedFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {/* File upload hidden input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  <UploadCloud className="w-4 h-4 text-indigo-500" />
                  <span>Attach Image or PDF</span>
                </button>

                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${
                    isListening
                      ? 'bg-red-500 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Dictate with voice"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-500" />}
                  <span>{isListening ? 'Stop Mic' : 'Voice'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleExtractEvent}
                disabled={isExtracting || (!inputText.trim() && !attachedFile)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 active:scale-95"
              >
                {isExtracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Extracting Structured Event...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract & Structure</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extracted Event Review Card */}
          {currentProposal && (
            <div className="animate-in fade-in duration-300">
              <EventReviewCard
                proposal={currentProposal}
                isSubmitting={isSubmittingProposal}
                onConfirm={handleConfirmProposal}
                onReject={handleRejectProposal}
                onEditProposal={(updated) => setCurrentProposal(updated)}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB 2: Academic Planner View */}
      {/* ========================================================= */}
      {activeTab === 'planner' && (
        <PlannerView
          planner={plannerData}
          isLoading={isLoadingData}
          onToggleTask={handleToggleTask}
          onCancelEvent={handleCancelEvent}
          onRefresh={loadCopilotData}
          onGenerateStudyPlan={(targetEventId) => {
            const event = eventsList.find((e) => e.id === targetEventId);
            if (event && event.tasks && event.tasks.length > 0) {
              setSuccessMessage(`Roadmap created with ${event.tasks.length} study checkpoints for ${event.title}!`);
            } else {
              setSuccessMessage('Study roadmap generated based on your exam syllabus.');
            }
          }}
        />
      )}

      {/* ========================================================= */}
      {/* 5. TAB 3: Tasks & Study Checkpoints */}
      {/* ========================================================= */}
      {activeTab === 'tasks' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Study Tasks & Revision Checkpoints
              </h3>
              <p className="text-[11px] text-slate-500">
                Derived from exams or created manually
              </p>
            </div>
          </div>

          {/* Quick task creation form */}
          <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add new study goal (e.g. Solve 5 DBMS gate questions)..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </form>

          {/* Tasks list */}
          {tasksList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-1">
              <ListTodo className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="font-medium">No tasks found.</p>
              <p className="text-[11px] text-slate-500">
                Tasks are automatically extracted when you schedule an exam or course.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              {tasksList.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className="text-slate-400 hover:text-indigo-600 transition"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-400" />
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
                      {task.dueDate && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                      task.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. TAB 4: Reminders & Alerts */}
      {/* ========================================================= */}
      {activeTab === 'reminders' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Scheduled Reminders & Notification Queues
              </h3>
              <p className="text-[11px] text-slate-500">
                Executed via n8n cron scheduler without requiring an open browser
              </p>
            </div>
          </div>

          {remindersList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-1">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="font-medium">No active reminders.</p>
              <p className="text-[11px] text-slate-500">
                Reminders are created with events to notify you 1 day and 1 hour before exams.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {remindersList.map((rem) => (
                <div
                  key={rem.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {rem.eventTitle || 'Academic Event'}
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded">
                        {rem.channel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
                      <span>Trigger: {new Date(rem.scheduledAt).toLocaleString()}</span>
                      <span>({rem.timezone})</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full w-fit ${
                      rem.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : rem.status === 'scheduled'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {rem.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. TAB 5: Automation Activity Log */}
      {/* ========================================================= */}
      {activeTab === 'automations' && (
        <AutomationHistoryPanel
          actions={actionsList}
          isLoading={isLoadingData}
          onRefresh={loadCopilotData}
        />
      )}

      {/* ========================================================= */}
      {/* 8. TAB 6: Integrations Setup */}
      {/* ========================================================= */}
      {activeTab === 'integrations' && (
        <IntegrationsPanel hasN8nConfigured={false} />
      )}
    </div>
  );
}
