'use client';

import React, { useMemo } from 'react';
import { TutorMessage, TutorSuggestedAction, TutorStructuredResponse } from '@/types';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  BrainCircuit,
  MessageSquare,
  Compass,
  Cpu,
  Calculator,
  Atom,
  Dna,
  History,
  Terminal,
  Columns3,
  GitCommit,
  Check,
  Copy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { parseModelTutorOutput } from '@/lib/tutorResponseParser';
import { SafeMarkdown } from './SafeMarkdown';
import { VisualExplanation } from './VisualExplanation';
import { InteractivePracticeCard } from './InteractivePracticeCard';
import { MistakeAnalysisCard } from './MistakeAnalysisCard';
import { KeyTakeawayCard } from './KeyTakeawayCard';
import { TutorActionButtons } from './TutorActionButtons';

interface TutorAnswerCardProps {
  message: TutorMessage;
  onActionClick: (action: TutorSuggestedAction) => void;
  onFollowUpClick: (question: string) => void;
  isCopied?: boolean;
  onCopy?: () => void;
  isSpeaking?: boolean;
  onSpeak?: () => void;
}

export function TutorAnswerCard({
  message,
  onActionClick,
  onFollowUpClick,
  isCopied,
  onCopy,
  isSpeaking,
  onSpeak,
}: TutorAnswerCardProps) {
  // Extract or parse structured response
  const structuredData: TutorStructuredResponse = useMemo(() => {
    if (message.structured) {
      return message.structured;
    }
    const { structured } = parseModelTutorOutput(message.content || '');
    return structured;
  }, [message.structured, message.content]);

  const getTopicIcon = (type?: string) => {
    switch (type) {
      case 'algorithm':
      case 'computer_science':
        return <Cpu className="w-4 h-4 text-indigo-500" />;
      case 'mathematics':
        return <Calculator className="w-4 h-4 text-emerald-500" />;
      case 'physics':
        return <Atom className="w-4 h-4 text-cyan-500" />;
      case 'biology':
        return <Dna className="w-4 h-4 text-emerald-500" />;
      case 'programming':
        return <Terminal className="w-4 h-4 text-violet-500" />;
      case 'history':
        return <History className="w-4 h-4 text-amber-500" />;
      case 'comparison':
        return <Columns3 className="w-4 h-4 text-indigo-500" />;
      case 'process':
        return <GitCommit className="w-4 h-4 text-purple-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  const formatTopicLabel = (type?: string) => {
    if (!type) return 'Study Concept';
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Find any key takeaway section if not explicitly separated
  const takeawaySection = structuredData.sections?.find(s => s.type === 'key_takeaway');
  const mainSections = structuredData.sections?.filter(s => s.type !== 'key_takeaway') || [];

  return (
    <div className="w-full space-y-4 text-slate-900 dark:text-slate-100">
      {/* Main Card Container */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Header: Title, Topic Badge, Difficulty, Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60">
                {getTopicIcon(structuredData.responseType)}
                <span>{formatTopicLabel(structuredData.responseType)}</span>
              </span>

              {structuredData.difficulty && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {structuredData.difficulty}
                </span>
              )}

              {message.isSocratic && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  <Compass className="w-3 h-3" /> Socratic Guided
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-1">
              {structuredData.title}
            </h3>
          </div>

          {/* Quick Audio / Copy Actions */}
          <div className="flex items-center gap-1 self-end sm:self-center text-slate-400">
            {onCopy && (
              <button
                type="button"
                onClick={onCopy}
                className="p-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Copy text"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}

            {onSpeak && (
              <button
                type="button"
                onClick={onSpeak}
                className="p-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Listen to explanation"
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 text-rose-500 animate-pulse" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Explanation / Summary */}
        {structuredData.summary && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/25 border-l-4 border-indigo-600 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            <SafeMarkdown content={structuredData.summary} />
          </div>
        )}

        {/* Dynamic Visual Explanation */}
        {structuredData.visual && structuredData.visual.type !== 'none' && (
          <VisualExplanation visual={structuredData.visual} />
        )}

        {/* Sections & Explanations */}
        {mainSections.length > 0 && (
          <div className="space-y-4 pt-1">
            {mainSections.map((sec, idx) => (
              <div key={idx} className="space-y-2">
                {sec.title && (
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    {sec.title}
                  </h4>
                )}

                {sec.content && (
                  <div className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    <SafeMarkdown content={sec.content} />
                  </div>
                )}

                {/* Structured Step items */}
                {sec.items && sec.items.length > 0 && (
                  <div className="space-y-2 pl-1">
                    {sec.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5 text-xs"
                      >
                        <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {item.stepNumber || itemIdx + 1}
                        </span>
                        <div>
                          <strong className="font-semibold text-slate-900 dark:text-white block">
                            {item.title}
                          </strong>
                          <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.detail}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Real-world Example Card */}
        {structuredData.example && (
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs">
                💡
              </span>
              <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {structuredData.example.title || 'Practical Real-World Example'}
              </h5>
            </div>

            {structuredData.example.scenario && (
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 italic">
                Scenario: {structuredData.example.scenario}
              </p>
            )}

            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <SafeMarkdown content={structuredData.example.walkthrough} />
            </div>

            {structuredData.example.codeOrFormula && (
              <div className="mt-2 p-3 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
                <pre>
                  <code>{structuredData.example.codeOrFormula}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Mistake Analysis (if present) */}
        {structuredData.mistakeAnalysis && (
          <MistakeAnalysisCard data={structuredData.mistakeAnalysis} />
        )}

        {/* Key Takeaway Card */}
        {takeawaySection?.content && (
          <KeyTakeawayCard content={takeawaySection.content} />
        )}

        {/* Interactive Practice Question */}
        {structuredData.practiceQuestion && (
          <InteractivePracticeCard question={structuredData.practiceQuestion} />
        )}

        {/* Contextual Action Buttons */}
        <TutorActionButtons
          actions={structuredData.actions}
          suggestedActions={message.suggestedActions}
          onActionClick={onActionClick}
        />

        {/* Follow-up Questions Chips */}
        {structuredData.followUpQuestions && structuredData.followUpQuestions.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 pl-1">
              <MessageSquare className="w-3.5 h-3.5" /> Recommended Questions:
            </span>
            <div className="flex flex-wrap gap-2">
              {structuredData.followUpQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onFollowUpClick(q)}
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs transition text-left"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
