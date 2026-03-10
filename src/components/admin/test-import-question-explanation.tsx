'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Highlighter } from 'lucide-react';
import { useCallback, useRef } from 'react';

interface Props {
  explanation?: { text?: string; evidence?: string };
  stimulusContent: string;
  onChange: (explanation: { text?: string; evidence?: string }) => void;
}

export function QuestionExplanation({ explanation, stimulusContent, onChange }: Props) {
  const passageRef = useRef<HTMLDivElement>(null);

  const update = (key: 'text' | 'evidence', value: string) =>
    onChange({ ...explanation, [key]: value || undefined });

  const captureSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text) return;
    if (passageRef.current && selection?.anchorNode && passageRef.current.contains(selection.anchorNode)) {
      const current = explanation?.evidence ?? '';
      const newEvidence = current ? `${current}\n---\n${text}` : text;
      onChange({ ...explanation, evidence: newEvidence });
      selection.removeAllRanges();
    }
  }, [explanation, onChange]);

  return (
    <div className="space-y-3 border-l border-gray-200 pl-4">
      {/* Giải thích */}
      <div>
        <Label className="mb-1 block text-xs font-medium text-gray-600">Giải thích đáp án</Label>
        <textarea
          value={explanation?.text ?? ''}
          onChange={e => update('text', e.target.value)}
          placeholder="Tại sao đáp án này đúng?"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      {/* Bài đọc — quét text */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="block text-xs font-medium text-gray-600">Bài đọc</Label>
          <Button type="button" size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={captureSelection}>
            <Highlighter className="h-3 w-3" /> Lấy dẫn chứng
          </Button>
        </div>
        <div
          ref={passageRef}
          className="max-h-32 overflow-y-auto rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs text-gray-700 leading-relaxed cursor-text select-text prose prose-xs max-w-none"
          dangerouslySetInnerHTML={{ __html: stimulusContent || '<em class="text-gray-400">Chưa có nội dung</em>' }}
        />
      </div>

      {/* Dẫn chứng đã chọn */}
      <div>
        <Label className="mb-1 block text-xs font-medium text-gray-600">Dẫn chứng</Label>
        {explanation?.evidence ? (
          <div className="relative">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 whitespace-pre-wrap max-h-24 overflow-y-auto">
              {explanation.evidence}
            </div>
            <button
              type="button"
              onClick={() => update('evidence', '')}
              className="absolute top-1 right-1 text-amber-400 hover:text-amber-600 text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Quét text trên bài đọc rồi bấm &quot;Lấy dẫn chứng&quot;</p>
        )}
      </div>
    </div>
  );
}
