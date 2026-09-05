'use client';

import React from 'react';
import {
  Sparkles,
  HelpCircle,
  Compass,
  Repeat,
  CheckCircle,
  FileQuestion,
  Layers,
  Zap,
} from 'lucide-react';
import { TutorSuggestedAction } from '@/types';

interface TutorActionButtonsProps {
  actions?: string[];
  suggestedActions?: TutorSuggestedAction[];
  onActionClick: (action: TutorSuggestedAction) => void;
}

export function TutorActionButtons({
  actions,
  suggestedActions,
  onActionClick,
}: TutorActionButtonsProps) {
  // Consolidate actions
  const actionList: TutorSuggestedAction[] = [];

  if (suggestedActions && suggestedActions.length > 0) {
    actionList.push(...suggestedActions);
  } else if (actions && actions.length > 0) {
    actions.forEach(act => {
      switch (act) {
        case 'explain_simpler':
          actionList.push({ label: 'Explain Simpler', action: 'simplify' });
          break;
        case 'show_example':
          actionList.push({ label: 'Show Real Example', action: 'example' });
          break;
        case 'test_me':
          actionList.push({ label: 'Test My Understanding', action: 'practice' });
          break;
        case 'guide_me':
          actionList.push({ label: 'Guide Me (Socratic)', action: 'socratic' });
          break;
        case 'show_solution':
          actionList.push({ label: 'Show Full Solution', action: 'solution' });
          break;
        case 'try_similar':
          actionList.push({ label: 'Try Similar Problem', action: 'similar' });
          break;
        case 'generate_quiz':
          actionList.push({ label: 'Generate Quiz', action: 'practice' });
          break;
        case 'create_flashcards':
          actionList.push({ label: 'Create Flashcards', action: 'flashcards' });
          break;
        default:
          actionList.push({ label: act.replace(/_/g, ' '), action: 'practice' });
      }
    });
  }

  if (actionList.length === 0) return null;

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'simplify':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'example':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-500" />;
      case 'practice':
        return <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'socratic':
        return <Compass className="w-3.5 h-3.5 text-purple-500" />;
      case 'solution':
        return <CheckCircle className="w-3.5 h-3.5 text-blue-500" />;
      case 'similar':
        return <Repeat className="w-3.5 h-3.5 text-cyan-500" />;
      case 'flashcards':
        return <Layers className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <FileQuestion className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div className="pt-2 space-y-1.5">
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block pl-1">
        Next Learning Steps:
      </span>
      <div className="flex flex-wrap gap-2">
        {actionList.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onActionClick(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-white hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-slate-800/90 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs hover:border-indigo-400 dark:hover:border-indigo-700 transition"
          >
            {getActionIcon(item.action)}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
