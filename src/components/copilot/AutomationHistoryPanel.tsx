'use client';

import React, { useState } from 'react';
import {
  Workflow,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AssistantActionRunItem } from '@/types/assistant';

interface AutomationHistoryPanelProps {
  actions: AssistantActionRunItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AutomationHistoryPanel({
  actions,
  isLoading,
  onRefresh,
}: AutomationHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Completed</span>
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <Clock className="w-3 h-3 text-indigo-500 animate-spin" />
            <span>Dispatched</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>Failed</span>
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <span>Pending Setup</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Automation Activity & n8n Runs
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Deterministic, idempotent event dispatches
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Refresh automation logs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {actions.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-1">
          <Workflow className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="font-medium">No automation activity recorded yet.</p>
          <p className="text-[11px] text-slate-500">
            Confirming an event or scheduling a reminder triggers verified n8n workflows.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {actions.map((act) => {
            const isExpanded = expandedId === act.id;
            return (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(act.status)}
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {act.actionType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{new Date(act.createdAt).toLocaleTimeString()}</span>
                    <span>&bull;</span>
                    <span>{new Date(act.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Idempotency key snippet */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5 truncate mr-2">
                    <span className="text-slate-400">Idempotency Key:</span>
                    <span className="truncate max-w-[200px]">{act.idempotencyKey}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(act.idempotencyKey)}
                      className="p-0.5 hover:text-indigo-600 transition"
                      title="Copy full key"
                    >
                      {copiedKey === act.idempotencyKey ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : act.id)}
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline shrink-0"
                  >
                    <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Error Banner if any */}
                {act.error && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900/40">
                    {act.error}
                  </p>
                )}

                {/* Expandable JSON Payload */}
                {isExpanded && (
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800">
                      <span>SANITIZED DISPATCH PAYLOAD</span>
                      {act.n8nExecutionId && (
                        <span>n8n Exec ID: {act.n8nExecutionId}</span>
                      )}
                    </div>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(act.payload, null, 2)}</pre>
                    {act.result && (
                      <>
                        <div className="text-[10px] text-emerald-400 pt-2 border-t border-slate-800">
                          EXECUTION RESULT
                        </div>
                        <pre className="whitespace-pre-wrap text-emerald-300">
                          {JSON.stringify(act.result, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
