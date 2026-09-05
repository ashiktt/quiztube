'use client';

import React from 'react';
import { DiagramNode, DiagramEdge } from '@/types';
import { GitCommit, ArrowRight, Sparkles } from 'lucide-react';
import { MermaidRenderer } from '../MermaidRenderer';

interface ProcessFlowVisualProps {
  title?: string;
  nodes?: DiagramNode[];
  edges?: DiagramEdge[];
  mermaidCode?: string;
}

export function ProcessFlowVisual({
  title,
  nodes,
  edges,
  mermaidCode,
}: ProcessFlowVisualProps) {
  // If Mermaid diagram code is provided, use MermaidRenderer
  if (mermaidCode) {
    return <MermaidRenderer code={mermaidCode} title={title || 'Process Flowchart'} />;
  }

  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <GitCommit className="w-4 h-4" />
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          {title || 'Sequential Process Flow'}
        </h4>
      </div>

      {/* Horizontal / Wrapped Step Flow */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-slate-50/70 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
        {nodes.map((node, idx) => {
          const isLast = idx === nodes.length - 1;

          return (
            <React.Fragment key={node.id}>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex-1 min-w-[130px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {node.type && (
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                      {node.type}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {node.label}
                </div>
                {node.details && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {node.details}
                  </p>
                )}
              </div>

              {!isLast && (
                <div className="text-slate-400 shrink-0 hidden sm:flex items-center">
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
