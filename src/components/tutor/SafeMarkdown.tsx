'use client';

import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

export function SafeMarkdown({ content, className = '' }: SafeMarkdownProps) {
  if (!content) return null;

  // Sanitize malformed asterisks (e.g. "*Consensus:**" or "***Consensus:***") and artifacts like (***)
  const sanitized = content
    .replace(/\(\*{2,}\)/g, '')
    .replace(/(^|\n)\*+([^*:\n]+):?\*+/g, '$1**$2:**')
    .replace(/\*{3,}/g, '**');

  // Split into paragraphs / blocks
  const blocks = sanitized.split(/\n{2,}/);

  return (
    <div className={`space-y-4 leading-relaxed text-slate-800 dark:text-slate-200 ${className}`}>
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Fenced code block
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const lines = trimmed.split('\n');
          const lang = lines[0].replace(/^```/, '').trim() || 'code';
          const code = lines.slice(1, -1).join('\n');
          return (
            <div key={idx} className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 text-xs sm:text-sm font-mono shadow-xs max-w-full">
              {lang && (
                <div className="px-3.5 py-1.5 bg-slate-800/80 text-slate-400 text-[10px] sm:text-xs font-semibold border-b border-slate-700/50 uppercase tracking-wider">
                  {lang}
                </div>
              )}
              <pre className="p-3.5 sm:p-4 overflow-x-auto leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Markdown Table: | ... | ... |
        if (trimmed.startsWith('|') && trimmed.includes('|') && trimmed.includes('---')) {
          const lines = trimmed.split('\n').filter(l => l.trim().startsWith('|'));
          if (lines.length >= 2) {
            const parseCells = (line: string) =>
              line.split('|').slice(1, -1).map(c => c.trim());

            const headers = parseCells(lines[0]);
            const rows = lines.slice(2).map(parseCells);

            return (
              <div key={idx} className="my-3.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs max-w-full">
                <table className="min-w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold">
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3 sm:px-4 py-2.5 font-semibold whitespace-nowrap">
                          {renderInlineTokens(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 sm:px-4 py-2 text-slate-700 dark:text-slate-300 break-words">
                            {renderInlineTokens(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Heading block (#, ##, ###, ####)
        const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];

          if (level === 1) {
            return (
              <h2 key={idx} className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white pt-2 border-b border-slate-100 dark:border-slate-800 pb-1.5 break-words">
                {renderInlineTokens(text)}
              </h2>
            );
          }
          if (level === 2) {
            return (
              <h3 key={idx} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-2 break-words">
                {renderInlineTokens(text)}
              </h3>
            );
          }
          return (
            <h4 key={idx} className="text-sm sm:text-base font-bold text-indigo-700 dark:text-indigo-300 pt-1.5 break-words">
              {renderInlineTokens(text)}
            </h4>
          );
        }

        // Blockquote
        if (/^>\s*/.test(trimmed)) {
          const text = trimmed.replace(/^>\s*/gm, '');
          return (
            <blockquote key={idx} className="border-l-4 border-indigo-500 pl-3.5 sm:pl-4 py-2 text-slate-700 dark:text-slate-300 italic bg-indigo-50/50 dark:bg-indigo-950/20 rounded-r-xl my-2.5 text-[15px] sm:text-base leading-relaxed break-words">
              {renderInlineTokens(text)}
            </blockquote>
          );
        }

        // Unordered List
        if (/^[-*+]\s+/m.test(trimmed)) {
          const items = trimmed.split('\n').filter(l => /^[-*+]\s+/.test(l.trim()));
          if (items.length > 0) {
            return (
              <ul key={idx} className="space-y-2 list-disc list-outside ml-5 text-[15px] sm:text-base">
                {items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-slate-700 dark:text-slate-300 leading-relaxed pl-1 break-words">
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
              <ol key={idx} className="space-y-2 list-decimal list-outside ml-5 text-[15px] sm:text-base">
                {items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-slate-700 dark:text-slate-300 leading-relaxed pl-1 break-words">
                    {renderInlineTokens(item.replace(/^\d+\.\s+/, ''))}
                  </li>
                ))}
              </ol>
            );
          }
        }

        // Standard Paragraph
        return (
          <p key={idx} className="text-[15px] sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 break-words">
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
