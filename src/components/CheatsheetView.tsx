'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  FileDown,
  Printer,
  Copy,
  Check,
  Play,
  Lightbulb,
  Table as TableIcon,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';
import { LectureStudySet, TutorContext } from '@/types';
import { MermaidRenderer } from './MermaidRenderer';
import { formatSecondsToTimestamp } from '@/lib/youtube';

interface CheatsheetViewProps {
  studySet: LectureStudySet;
  onSeekVideo: (seconds: number) => void;
  onOpenExport?: () => void;
  onAskTutor?: (context: TutorContext) => void;
}

export function CheatsheetView({
  studySet,
  onSeekVideo,
  onOpenExport,
  onAskTutor,
}: CheatsheetViewProps) {
  const [copiedFormulaIdx, setCopiedFormulaIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const cheatsheet = studySet.cheatsheet;

  const handleCopyFormula = (formula: string, idx: number) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormulaIdx(idx);
    setTimeout(() => setCopiedFormulaIdx(null), 2000);
  };

  const handleCopyAllFormulas = () => {
    if (!cheatsheet?.coreFormulas) return;
    const text = cheatsheet.coreFormulas
      .map(f => `${f.label}:\n${f.formula}\n(${f.explanation})`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAskTutorAboutCheatsheet = () => {
    if (!onAskTutor) return;
    const context: TutorContext = {
      type: 'lecture',
      lectureTitle: studySet.videoTitle,
      videoId: studySet.videoId,
      videoUrl: studySet.videoUrl,
      notesOrCheatsheetSnippet: studySet.overallSummary || 'Lecture cheatsheet and visual notes',
      topicTag: studySet.difficulty,
    };
    onAskTutor(context);
  };

  // High-res video banner image with fallback
  const heroImage =
    cheatsheet?.heroImageUrl ||
    (studySet.videoId ? `https://img.youtube.com/vi/${studySet.videoId}/maxresdefault.jpg` : studySet.thumbnailUrl);

  return (
    <div className="space-y-8 max-w-5xl mx-auto print:p-0 print:m-0">
      {/* Top Header & Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Visual Study Cheatsheet
            </h2>
            <p className="text-xs text-slate-500">
              High-yield formulas, flowcharts, comparison tables & visual concepts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAskTutor && (
            <button
              type="button"
              onClick={handleAskTutorAboutCheatsheet}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 rounded-xl transition shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Ask AI Tutor</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print 1-Page Cheatsheet</span>
          </button>

          {onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-500/20"
            >
              <FileDown className="w-4 h-4" />
              <span>Export PDF / Notes</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-xl">
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src={heroImage}
            alt={studySet.videoTitle}
            className="w-full h-full object-cover blur-sm scale-105"
            onError={e => {
              // fallback to standard thumbnail if maxres fails
              if (studySet.thumbnailUrl) {
                (e.target as HTMLImageElement).src = studySet.thumbnailUrl;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500 text-white rounded-lg shadow-sm">
                Active Recall Cheatsheet
              </span>
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-white/20 backdrop-blur-md rounded-lg text-white">
                {studySet.difficulty.toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {cheatsheet?.title || studySet.videoTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {cheatsheet?.subtitle || `Source: ${studySet.channelTitle}`}
            </p>
          </div>

          {studySet.thumbnailUrl && (
            <div className="relative shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl group w-44 sm:w-56 aspect-video">
              <img
                src={studySet.thumbnailUrl}
                alt="Lecture Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <button
                type="button"
                onClick={() => onSeekVideo(0)}
                className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition"
                title="Play Video"
              >
                <div className="p-2.5 bg-red-600 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-white" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Core Formulas / Equation Highlights */}
      {cheatsheet?.coreFormulas && cheatsheet.coreFormulas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Core Formulas & High-Yield Equations
              </h3>
            </div>

            <button
              onClick={handleCopyAllFormulas}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied All!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All Formulas</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cheatsheet.coreFormulas.map((item, idx) => (
              <div
                key={idx}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2.5 hover:border-indigo-300 dark:hover:border-indigo-700 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {item.label}
                  </span>
                  <button
                    onClick={() => handleCopyFormula(item.formula, idx)}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Copy formula"
                  >
                    {copiedFormulaIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="p-3 bg-slate-900 dark:bg-slate-950 text-indigo-300 dark:text-indigo-200 font-mono text-sm sm:text-base font-bold rounded-xl border border-slate-800 overflow-x-auto">
                  {item.formula}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Flowchart / Diagram */}
      {cheatsheet?.flowchart && cheatsheet.flowchart.mermaidCode && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Visual Architecture & Flow Diagram
            </h3>
          </div>

          <MermaidRenderer
            title={cheatsheet.flowchart.title}
            code={cheatsheet.flowchart.mermaidCode}
          />
          {cheatsheet.flowchart.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic px-2">
              {cheatsheet.flowchart.description}
            </p>
          )}
        </div>
      )}

      {/* Comparison Table / Matrix */}
      {cheatsheet?.comparisonTable && cheatsheet.comparisonTable.headers?.length > 0 && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-xl">
              <TableIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {cheatsheet.comparisonTable.title || 'Quick Comparison Matrix'}
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  {cheatsheet.comparisonTable.headers.map((h, hIdx) => (
                    <th key={hIdx} className="p-3.5 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cheatsheet.comparisonTable.rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-3.5 text-slate-700 dark:text-slate-300 ${
                          cIdx === 0 ? 'font-bold text-indigo-600 dark:text-indigo-400' : ''
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cheatsheet Key Concept Sections with Video Jump Cards */}
      {cheatsheet?.sections && cheatsheet.sections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Key Sections & Practical Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cheatsheet.sections.map((sec, idx) => (
              <div
                key={idx}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {sec.title}
                    </h4>
                    {sec.timestampFormatted && (
                      <button
                        onClick={() =>
                          onSeekVideo(sec.timestampSeconds || 0)
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800 transition"
                        title="Jump video to this section"
                      >
                        <Play className="w-3 h-3 fill-red-500" />
                        <span>{sec.timestampFormatted}</span>
                      </button>
                    )}
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {sec.keyPoints.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>

                  {sec.formulaOrCode && (
                    <pre className="p-2.5 bg-slate-950 text-indigo-300 text-xs font-mono rounded-xl overflow-x-auto">
                      {sec.formulaOrCode}
                    </pre>
                  )}
                </div>

                {sec.mermaidCode && (
                  <div className="pt-2">
                    <MermaidRenderer
                      title={sec.diagramTitle || sec.title}
                      code={sec.mermaidCode}
                      className="border-indigo-100 dark:border-indigo-950"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Pitfalls & Mistakes vs Correct Facts */}
      {cheatsheet?.pitfalls && cheatsheet.pitfalls.length > 0 && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Common Exam Pitfalls & Misconceptions
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cheatsheet.pitfalls.map((pitfall, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2.5"
              >
                <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Misconception: {pitfall.misconception}</span>
                </div>

                <div className="flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Correct Fact: {pitfall.correctFact}</span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pl-6">
                  Why: {pitfall.whyItMatters}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
