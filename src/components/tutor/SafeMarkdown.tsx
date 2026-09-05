'use client';

import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

export function SafeMarkdown({ content, className = '' }: SafeMarkdownProps) {
  if (!content) return null;

  // Split into paragraphs / blocks
  const blocks = content.split(/\n{2,}/);

  return (
    <div className={`space-y-3 leading-relaxed text-slate-800 dark:text-slate-200 ${className}`}>
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Fenced code block
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const lines = trimmed.split('\n');
          const lang = lines[0].replace(/^```/, '').trim() || 'code';
          const code = lines.slice(1, -1).join('\n');
          return (
            <div key={idx} className="my-2.5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 text-xs font-mono">
              {lang && (
                <div className="px-3 py-1 bg-slate-800/80 text-slate-400 text-[10px] font-semibold border-b border-slate-700/50 uppercase tracking-wider">
                  {lang}
                </div>
              )}
              <pre className="p-3.5 overflow-x-auto">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Heading block
        if (/^#{1,4}\s+/.test(trimmed)) {
          const text = trimmed.replace(/^#{1,4}\s+/, '');
          return (
            <h4 key={idx} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pt-1">
              {renderInlineTokens(text)}
            </h4>
          );
        }

        // Blockquote
        if (/^>\s*/.test(trimmed)) {
          const text = trimmed.replace(/^>\s*/gm, '');
          return (
            <blockquote key={idx} className="border-l-4 border-indigo-500 pl-3.5 py-1 text-slate-600 dark:text-slate-300 italic bg-indigo-50/40 dark:bg-indigo-950/20 rounded-r-lg my-2 text-xs sm:text-sm">
              {renderInlineTokens(text)}
            </blockquote>
          );
        }

        // Unordered List
        if (/^[-*+]\s+/m.test(trimmed)) {
          const items = trimmed.split('\n').filter(l => /^[-*+]\s+/.test(l.trim()));
          if (items.length > 0) {
            return (
              <ul key={idx} className="space-y-1.5 list-disc list-inside text-xs sm:text-sm pl-1">
                {items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-slate-700 dark:text-slate-300">
                    {renderInlineTokens(item.replace(/^[-*+]\s+/, ''))}
                  </li>
                ))}
              </ul>
            );
          }
        }

        // Ordered List
        if (/^\d+\.\s+/m.test(trimmed)) {
          const items = trimmed.split('\n').filter(l => /^\d+\.\s+/.test(l.trim()));
          if (items.length > 0) {
            return (
              <ol key={idx} className="space-y-1.5 list-decimal list-inside text-xs sm:text-sm pl-1">
                {items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-slate-700 dark:text-slate-300">
                    {renderInlineTokens(item.replace(/^\d+\.\s+/, ''))}
                  </li>
                ))}
              </ol>
            );
          }
        }

        // Standard Paragraph
        return (
          <p key={idx} className="text-xs sm:text-sm">
            {renderInlineTokens(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Safely parses bold, italic, and inline code without regex hazards
 */
function renderInlineTokens(text: string): React.ReactNode {
  // Regex splits tokens by code `...`, bold **...**, or italic *...*
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] sm:text-xs font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
