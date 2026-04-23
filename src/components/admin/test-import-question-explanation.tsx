'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Highlighter } from 'lucide-react';
import { EvidenceList } from '@/components/admin/evidence-list';
import { useCallback, useEffect, useRef } from 'react';

interface Props {
  explanation?: { text?: string; evidence?: string; offsets?: number[] };
  stimulusContent: string;
  onChange: (explanation: { text?: string; evidence?: string; offsets?: number[] }) => void;
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
      let offset = -1;
      try {
        const range = selection.rangeCount ? selection.getRangeAt(0) : null;
        if (range?.startContainer && passageRef.current.contains(range.startContainer)) {
          const preRange = document.createRange();
          preRange.selectNodeContents(passageRef.current);
          preRange.setEnd(range.startContainer, range.startOffset);
          offset = preRange.toString().length;
        }
      } catch {
        offset = -1;
      }
      const current = explanation?.evidence ?? '';
      const currentOffsets = explanation?.offsets ?? [];
      const newEvidence = current ? `${current}\n---\n${text}` : text;
      onChange({
        ...explanation,
        evidence: newEvidence,
        offsets: [...currentOffsets, offset],
      });
      selection.removeAllRanges();
    }
  }, [explanation, onChange]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [explanation?.text]);

  return (
    <div className="space-y-3 border-l border-gray-200 pl-4">
      {/* Giải thích */}
      <div>
        <Label className="mb-1 block text-xs font-medium text-gray-600">Giải thích đáp án</Label>
        <textarea
          ref={textareaRef}
          value={explanation?.text ?? ''}
          onChange={e => update('text', e.target.value)}
          placeholder="Tại sao đáp án này đúng?"
          className="w-full shrink-0 overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Bài đọc — quét text */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="block text-xs font-medium text-gray-600">Bài đọc</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 text-xs gap-1"
            onPointerDown={(e) => {
              e.preventDefault();
              captureSelection();
            }}
          >
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
        <EvidenceList
          evidence={explanation?.evidence}
          offsets={explanation?.offsets}
          onChange={(evidence, offsets) => onChange({ ...explanation, evidence, offsets })}
        />
      </div>
    </div>
  );
}
