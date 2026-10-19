'use client';

import React from 'react';
import {
  Workflow,
  Calendar,
  Mail,
  Mic,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

interface IntegrationsPanelProps {
  hasN8nConfigured?: boolean;
}

export function IntegrationsPanel({ hasN8nConfigured = false }: IntegrationsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-1">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Sliders className="w-4 h-4" />
          <span>Integration Boundaries & Services</span>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
          Connected Automation Providers
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
          Saberio AI strictly avoids mock success states. Integrations operate through verified server-side authentication, database persistence, and external workflow engines.
        </p>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. n8n Automation Engine */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 dark:bg-orange-950/80 text-orange-600 rounded-2xl">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  n8n Automation Engine
                </h4>
                <p className="text-[11px] text-slate-500">Event orchestration & webhooks</p>
              </div>
            </div>

            {hasN8nConfigured ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Configured</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>Pending Setup</span>
              </span>
            )}
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 font-mono text-[11px]">
            <p className="text-slate-500">Required Environment Variables:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
              <li>N8N_EVENT_WEBHOOK_URL</li>
              <li>N8N_WEBHOOK_SECRET</li>
              <li>ASSISTANT_INTERNAL_API_SECRET</li>
            </ul>
          </div>

          <p className="text-xs text-slate-500">
            Workflows ready for import: <code className="text-indigo-600 dark:text-indigo-400 font-mono">n8n/workflows/student-copilot-event-automation.json</code>.
          </p>
        </div>

        {/* 2. In-App & Email Notifications */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/80 text-blue-600 rounded-2xl">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Notification Delivery
                </h4>
                <p className="text-[11px] text-slate-500">In-App alerts & SMTP Dispatch</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>In-App Active</span>
            </span>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <p>
              <strong>In-App Reminders:</strong> Persisted in MongoDB and queried every minute by the internal reminder scheduler.
            </p>
            <p>
              <strong>Email Notifications:</strong> Delivered via n8n SMTP nodes only when credentials are explicitly configured.
            </p>
          </div>

          <p className="text-xs text-slate-500">
            Polls via: <code className="text-indigo-600 dark:text-indigo-400 font-mono">/api/assistant/internal/reminders/due</code>.
          </p>
        </div>

        {/* 3. Google Calendar (Honest Disconnected State) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/80 text-rose-600 rounded-2xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Google Calendar Sync
                </h4>
                <p className="text-[11px] text-slate-500">2-way calendar sync</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <AlertCircle className="w-3 h-3 text-slate-400" />
              <span>Disconnected</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Google Calendar synchronization requires OAuth 2.0 authorization with <code className="font-mono text-[11px]">https://www.googleapis.com/auth/calendar.events</code>. Direct export to .ics calendar format is available on confirmed events.
          </p>

          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Per application security policy, calendar write permissions are requested only through verified student OAuth.
            </span>
          </div>
        </div>

        {/* 4. Voice Input Integration */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 rounded-2xl">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Voice Dictation Input
                </h4>
                <p className="text-[11px] text-slate-500">Dictate exam notices & schedules</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Browser Web Speech Ready</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Students can dictate notice text directly using the microphone button on supported browsers. Audio streams are transcribed clientside without transmitting raw voice recordings.
          </p>
        </div>
      </div>
    </div>
  );
}
