'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Code, Check, Copy, AlertCircle, Sparkles, Maximize2, X } from 'lucide-react';

interface MermaidRendererProps {
  code: string;
  title?: string;
  className?: string;
}

export function MermaidRenderer({ code, title, className = '' }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lock body scroll when fullscreen modal is open
  useEffect(() => {
    if (isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen]);

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      if (!code || !code.trim()) return;

      try {
        setError(null);
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
          },
          themeVariables: {
            primaryColor: '#6366f1',
            primaryTextColor: '#1e1b4b',
            primaryBorderColor: '#4f46e5',
            lineColor: '#6366f1',
            secondaryColor: '#ec4899',
            tertiaryColor: '#f3f4f6',
          },
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const cleanCode = code
          .trim()
          .replace(/```mermaid/gi, '')
          .replace(/```/g, '')
          .trim();

        const { svg } = await mermaid.render(id, cleanCode);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        console.warn('Mermaid rendering warning:', err);
        if (isMounted) {
          setError('Could not render visual diagram layout. Showing structured diagram code.');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 ${className}`}>
      {/* Title & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            {title || 'Visual Concept Flowchart'}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {svgContent && !error && !showRaw && (
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Expand diagram fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            {showRaw ? 'View Diagram' : 'View Code'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Copy diagram markup"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {showRaw ? (
        <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-xs overflow-x-auto font-mono">
          {code}
        </pre>
      ) : error ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <pre className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs overflow-x-auto font-mono text-slate-700 dark:text-slate-300">
            {code}
          </pre>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={containerRef}
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="overflow-x-auto no-scrollbar flex justify-start sm:justify-center py-2 min-h-[140px] [&>svg]:min-w-[280px] sm:[&>svg]:min-w-0 [&>svg]:max-w-none sm:[&>svg]:max-w-full [&>svg]:h-auto px-1"
          />
          <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-slate-400">
            <span className="sm:hidden">↔ Swipe horizontally</span>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 ml-auto font-medium"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              <span>Tap to enlarge</span>
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 w-full max-w-4xl max-h-[90dvh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>{title || 'Visual Concept Flowchart'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[250px]">
              <div
                dangerouslySetInnerHTML={{ __html: svgContent }}
                className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto overflow-x-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
