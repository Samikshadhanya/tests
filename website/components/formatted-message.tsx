'use client';

import React from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  role: 'user' | 'assistant';
  leaderName?: string;
  leaderPhone?: string;
}

/**
 * Parses inline markdown-like syntax (**bold**, *italic*, `code`) into clean JSX elements
 */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
      return (
        <em key={index} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={index} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-teal-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  return /^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)*\|?$/.test(trimmed);
}

function parseTableLine(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((c) => c.trim());
}

type ContentBlock =
  | { type: 'paragraph' | 'bullet' | 'notice' | 'header'; text: string }
  | { type: 'refillAlertGroup'; alerts: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'empty' };

export function FormattedMessage({ content, role, leaderName, leaderPhone }: FormattedMessageProps) {
  if (role === 'user') {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  const rawLines = content.split('\n');
  const blocks: ContentBlock[] = [];

  let currentTableLines: string[] = [];

  const flushTable = () => {
    if (currentTableLines.length > 0) {
      const validLines = currentTableLines.filter((l) => !isTableSeparator(l));
      if (validLines.length > 0) {
        const headers = parseTableLine(validLines[0]);
        const rows = validLines.slice(1).map(parseTableLine);
        blocks.push({ type: 'table', headers, rows });
      }
      currentTableLines = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.includes('|')) {
      currentTableLines.push(trimmed);
      continue;
    } else {
      flushTable();
    }

    if (!trimmed) {
      blocks.push({ type: 'empty' });
      continue;
    }

    if (/^🔔?\s*Refill Alert/i.test(trimmed)) {
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.type === 'refillAlertGroup') {
        lastBlock.alerts.push(trimmed);
      } else {
        blocks.push({ type: 'refillAlertGroup', alerts: [trimmed] });
      }
      continue;
    }

    if (/^(?:\*|-|•|\d+\.)\s+/.test(trimmed)) {
      blocks.push({ type: 'bullet', text: trimmed.replace(/^(?:\*|-|•|\d+\.)\s+/, '') });
      continue;
    }

    if (/^(?:Note:|⚠️|\*Note:)/i.test(trimmed)) {
      blocks.push({ type: 'notice', text: trimmed.replace(/^\*|\*$/g, '') });
      continue;
    }

    if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
      blocks.push({ type: 'header', text: trimmed.replace(/^#+\s*/, '') });
      continue;
    }

    blocks.push({ type: 'paragraph', text: trimmed });
  }

  flushTable();

  const phoneDigits = leaderPhone ? leaderPhone.replace(/\D/g, '') : '';
  const alertText = `Hi ${leaderName || 'Leader'}! MedHome Refill Alert: A medication refill has been requested for our household. Please assist with restocking.`;

  const waUrl = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(alertText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(alertText)}`;

  const smsUrl = phoneDigits
    ? `sms:${phoneDigits}?body=${encodeURIComponent(alertText)}`
    : `sms:?body=${encodeURIComponent(alertText)}`;

  return (
    <div className="space-y-1.5 text-slate-800 leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === 'empty') {
          return <div key={idx} className="h-1" />;
        }

        if (block.type === 'refillAlertGroup') {
          const details: string[] = [];
          block.alerts.forEach((text) => {
            let detail = '';
            const match = text.match(/(?:registered for|refill for|restock)\s+(.+?)(?:\.|$)/i);
            if (match && match[1]) {
              detail = match[1].trim();
              const hasQuantity = /\d+|strip|pack|box|bottle|unit|tablet/i.test(detail);
              if (!hasQuantity) {
                detail += ' (Quantity: 1 strip)';
              }
              details.push(detail);
            }
          });

          const detailText = details.length > 0
            ? `Hi ${leaderName || 'Leader'}! MedHome Refill Alert: Please assist with restocking the following medications:\n- ${details.join('\n- ')}`
            : `Hi ${leaderName || 'Leader'}! MedHome Refill Alert: A medication refill request has been logged. Please assist with restocking.`;

          const blockWaUrl = phoneDigits
            ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(detailText)}`
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(detailText)}`;

          const blockSmsUrl = phoneDigits
            ? `sms:${phoneDigits}?body=${encodeURIComponent(detailText)}`
            : `sms:?body=${encodeURIComponent(detailText)}`;

          return (
            <div
              key={idx}
              className="my-3 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50/60 p-3.5 shadow-sm text-xs text-slate-800 space-y-2.5"
            >
              <div className="flex items-start gap-2 font-medium text-teal-900 leading-snug">
                <span className="text-base select-none">🔔</span>
                <div className="flex-1 space-y-1">
                  {block.alerts.map((alertText, i) => (
                    <div key={i}>{renderInline(alertText)}</div>
                  ))}
                </div>
              </div>

              {/* Direct Messaging Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-teal-200/60">
                <a
                  href={blockWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-2xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send via WhatsApp</span>
                </a>

                <a
                  href={blockSmsUrl}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 active:scale-95 transition-all shadow-2xs"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Send via SMS / Message</span>
                </a>
              </div>
            </div>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={idx} className="my-2.5 overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    {block.headers.map((h, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 border-r border-slate-200/60 last:border-r-0 font-bold bg-slate-100">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-teal-50/30 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 border-r border-slate-100 last:border-r-0 text-slate-700">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'bullet') {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-teal-600 font-bold select-none text-xs mt-1">•</span>
              <div className="flex-1">{renderInline(block.text)}</div>
            </div>
          );
        }

        if (block.type === 'notice') {
          return (
            <div
              key={idx}
              className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-2.5 text-xs text-amber-900 font-medium leading-normal"
            >
              {renderInline(block.text)}
            </div>
          );
        }

        if (block.type === 'header') {
          return (
            <h4 key={idx} className="font-bold text-slate-900 text-sm mt-2.5 mb-1">
              {renderInline(block.text)}
            </h4>
          );
        }

        return (
          <p key={idx} className="text-slate-800">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

export default FormattedMessage;
