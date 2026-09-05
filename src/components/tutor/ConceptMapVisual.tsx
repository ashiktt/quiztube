'use client';

import React from 'react';
import { DiagramNode, DiagramEdge } from '@/types';
import { Network, Sparkles } from 'lucide-react';
import { MermaidRenderer } from '../MermaidRenderer';

interface ConceptMapVisualProps {
  title?: string;
  nodes?: DiagramNode[];
  edges?: DiagramEdge[];
  mermaidCode?: string;
}

export function ConceptMapVisual({
  title,
  nodes,
  edges,
  mermaidCode,
}: ConceptMapVisualProps) {
  if (mermaidCode) {
    return <MermaidRenderer code={mermaidCode} title={title || 'Concept Map'} />;
  }

  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Network className="w-4 h-4" />
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          {title || 'Concept Relationship Map'}
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
        {nodes.map((node, idx) => (
          <div
            key={node.id || idx}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1"
          >
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Concept {idx + 1}
            </span>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {node.label}
            </div>
            {node.details && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {node.details}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
