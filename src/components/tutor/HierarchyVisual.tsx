'use client';

import React, { useState } from 'react';
import { HierarchyLayer } from '@/types';
import { Layers, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface HierarchyVisualProps {
  title?: string;
  subtitle?: string;
  layers?: HierarchyLayer[];
}

export function HierarchyVisual({ title, subtitle, layers }: HierarchyVisualProps) {
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number | null>(0);

  if (!layers || layers.length === 0) return null;

  return (
    <div className="my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/60 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {title || 'Layered Visual Hierarchy'}
            </h4>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
          {layers.length} Layers • Click to inspect
        </span>
      </div>

      {/* Layer Stack */}
      <div className="space-y-2">
        {layers.map((layer, index) => {
          const isSelected = selectedLayerIndex === index;
          const layerNum = layer.layerNumber ?? layers.length - index;

          return (
            <div
              key={index}
              onClick={() => setSelectedLayerIndex(isSelected ? null : index)}
              className={`cursor-pointer transition-all duration-200 rounded-xl border p-3 ${
                isSelected
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-sm'
                  : 'bg-slate-50/60 dark:bg-slate-800/50 hover:bg-indigo-50/30 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {layerNum}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {layer.name}
                      </span>
                      {layer.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                          {layer.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      {layer.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="text-slate-400">
                  {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                  {layer.details && (
                    <p className="leading-relaxed">
                      {layer.details}
                    </p>
                  )}

                  {layer.protocolsOrExamples && layer.protocolsOrExamples.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Protocols / Examples:
                      </span>
                      {layer.protocolsOrExamples.map((item, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
