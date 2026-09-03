'use client';

import React, { useState } from 'react';
import {
  X,
  FileDown,
  FileText,
  Layers,
  Code2,
  Check,
  Download,
  Share2,
  Sparkles,
} from 'lucide-react';
import { LectureStudySet } from '@/types';
import {
  exportQuizToPdf,
  exportFlashcardsToAnki,
  exportStudyGuideToMarkdown,
} from '@/lib/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studySet: LectureStudySet;
}

export function ExportModal({ isOpen, onClose, studySet }: ExportModalProps) {
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  const handleExportPdf = () => {
    exportQuizToPdf(studySet);
  };

  const handleExportAnki = () => {
    exportFlashcardsToAnki(studySet);
  };

  const handleExportMarkdown = () => {
    exportStudyGuideToMarkdown(studySet);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(studySet, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-5 sm:p-6 bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl space-y-5 sm:space-y-6 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto pb-safe">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-md shrink-0">
            <FileDown className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Export Study Materials</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download printable exams, visual cheatsheets, or markdown notes
            </p>
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {/* PDF Option */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Printable Assessment (PDF)
                </h4>
                <p className="text-xs text-slate-500">
                  Complete student test sheet with separated answer key on the last page
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
          </button>

          {/* Anki Option */}
          <button
            type="button"
            onClick={handleExportAnki}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Anki / Quizlet Deck (.txt)
                </h4>
                <p className="text-xs text-slate-500">
                  Importable flashcard deck with terms, definitions, and timestamps
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
          </button>

          {/* Markdown Option */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Markdown Study Cheatsheet (.md)
                </h4>
                <p className="text-xs text-slate-500">
                  Formatted summary, key takeaways, and collapsible quiz answers
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
          </button>

          {/* JSON Copy Option */}
          <button
            type="button"
            onClick={handleCopyJson}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Copy Raw Study Set (JSON)
                </h4>
                <p className="text-xs text-slate-500">
                  Full structured data for developers and external apps
                </p>
              </div>
            </div>
            {copiedJson ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Copied!
              </span>
            ) : (
              <span className="text-xs text-slate-400 group-hover:text-indigo-600">Copy</span>
            )}
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
