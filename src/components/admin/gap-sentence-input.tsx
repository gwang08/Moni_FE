'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Highlighter, X } from 'lucide-react';

interface Props {
  value: string; // raw content with {{answer}} marker
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Extract answer word from {{word}} marker */
function extractAnswer(text: string): string {
  const match = text.match(/\{\{(.+?)\}\}/);
  return match ? match[1] : '';
}

/** Convert raw "hello {{world}} foo" → display "hello world foo" */
function toDisplay(raw: string): string {
  return raw.replace(/\{\{(.+?)\}\}/g, '$1');
}

/** Render content with highlighted gap word */
function HighlightedPreview({ content, onClearGap }: { content: string; onClearGap: () => void }) {
  const parts = content.split(/(\{\{.+?\}\})/);
  return (
    <span>
      {parts.map((part, i) => {
        const match = part.match(/^\{\{(.+?)\}\}$/);
        if (match) {
          return (
            <span key={i} className="relative inline-flex items-center gap-0.5 bg-yellow-200 text-yellow-900 font-semibold px-1.5 py-0.5 rounded mx-0.5">
              {match[1]}
              <button type="button" onClick={onClearGap}
                className="text-yellow-600 hover:text-red-500 -mr-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function GapSentenceInput({ value, onChange, placeholder }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(!extractAnswer(value));

  const answer = extractAnswer(value);
  const displayText = toDisplay(value);

  const handleMarkGap = () => {
    const ta = inputRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd } = ta;
    if (selectionStart === selectionEnd) return;

    const clean = toDisplay(ta.value);
    const selected = clean.substring(selectionStart, selectionEnd).trim();
    if (!selected) return;

    const pos = clean.indexOf(selected, selectionStart);
    const newContent = clean.substring(0, pos) + `{{${selected}}}` + clean.substring(pos + selected.length);
    onChange(newContent);
    setIsEditing(false);
  };

  const handleClearGap = () => {
    onChange(toDisplay(value));
    setIsEditing(true);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Editing mode: textarea + mark button
  if (isEditing || !answer) {
    return (
      <div className="space-y-1">
        <div className="flex gap-1">
          <textarea
            ref={inputRef}
            value={displayText}
            onChange={e => onChange(e.target.value)}
            onBlur={() => { if (answer) setIsEditing(false); }}
            placeholder={placeholder || 'Nhập câu đầy đủ, quét từ cần trống → bấm Đánh dấu'}
            rows={2}
            className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="button" size="sm" variant="outline"
            className="h-auto text-[10px] gap-0.5 px-2 shrink-0"
            onClick={handleMarkGap}>
            <Highlighter className="h-3 w-3" /> Đánh dấu
          </Button>
        </div>
      </div>
    );
  }

  // Preview mode: highlighted text
  return (
    <div className="space-y-1">
      <div
        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm cursor-text hover:bg-gray-100 transition-colors"
        onClick={handleEditClick}
      >
        <HighlightedPreview content={value} onClearGap={handleClearGap} />
      </div>
      <p className="text-[10px] text-green-700">Đáp án: <strong>{answer}</strong>
        <span className="text-gray-400 ml-2">(click để sửa câu)</span>
      </p>
    </div>
  );
}

export { extractAnswer };
