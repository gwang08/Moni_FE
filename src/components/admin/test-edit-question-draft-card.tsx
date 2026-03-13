'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Highlighter } from 'lucide-react';
import { McqOptions } from '@/components/admin/test-import-question-options-mcq';
import { TfngOptions } from '@/components/admin/test-import-question-options-tfng';
import { FillOptions } from '@/components/admin/test-import-question-options-fill';
import { GapSentenceInput, extractAnswer } from '@/components/admin/gap-sentence-input';
import type { QuestionTypeCode } from '@/types/admin.types';
import type { QuestionDraft } from '@/components/admin/test-edit-add-question-group-form';

interface Props {
  index: number;
  draft: QuestionDraft;
  typeCode: QuestionTypeCode;
  pendingEvidence?: string | null;
  onAssignEvidence?: (index: number) => void;
  onChange: (draft: QuestionDraft) => void;
  onRemove?: () => void;
}

export function TestEditQuestionDraftCard({ index, draft, typeCode, pendingEvidence, onAssignEvidence, onChange, onRemove }: Props) {
  const isGapType = typeCode === 'GAP_FILLING';

  return (
    <div className="bg-white rounded-md border border-gray-200 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 shrink-0">Câu {index + 1}</span>
        {isGapType ? (
          <div className="flex-1">
            <GapSentenceInput value={draft.content} onChange={val => {
              const answer = extractAnswer(val);
              onChange({ ...draft, content: val, options: [{ label: '', content: answer, isCorrect: true }] });
            }} />
          </div>
        ) : (
          <Input value={draft.content} onChange={e => onChange({ ...draft, content: e.target.value })}
            placeholder="Nội dung câu hỏi..." className="text-xs h-7 flex-1" />
        )}
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-gray-300 hover:text-red-500 shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!isGapType && (
        <div className="pl-[52px]">
          <Label className="mb-1 block text-[10px] text-gray-400 uppercase tracking-wide">Đáp án</Label>
          {(typeCode === 'MCQ' || typeCode === 'MCQ_MULTIPLE') && (
            <McqOptions options={draft.options} onChange={opts => onChange({ ...draft, options: opts })}
              multiple={typeCode === 'MCQ_MULTIPLE'} />
          )}
          {(typeCode === 'TFNG' || typeCode === 'YNNG') && (
            <TfngOptions options={draft.options} onChange={opts => onChange({ ...draft, options: opts })} variant={typeCode} />
          )}
          {typeCode === 'DIAGRAM_LABEL' && (
            <FillOptions options={draft.options} onChange={opts => onChange({ ...draft, options: opts })} variant={typeCode} />
          )}
          {(typeCode === 'MATCHING_HEADINGS' || typeCode === 'MATCHING_INFORMATION' || typeCode === 'MATCHING_FEATURE') && (
            <Input value={draft.options[0]?.content ?? ''} onChange={e => onChange({
              ...draft, options: [{ label: draft.options[0]?.label ?? 'A', content: e.target.value, isCorrect: true }],
            })} placeholder="Đáp án đúng..." className="text-xs h-7" />
          )}
        </div>
      )}

      {/* Explanation + Evidence */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
        <div>
          <Label className="mb-0.5 block text-[10px] text-gray-400">Giải thích</Label>
          <textarea value={draft.explanation?.text ?? ''}
            onChange={e => onChange({ ...draft, explanation: { ...draft.explanation, text: e.target.value || undefined } })}
            placeholder="Tại sao đáp án này đúng?" rows={2}
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <Label className="block text-[10px] text-gray-400">Dẫn chứng</Label>
            {pendingEvidence && onAssignEvidence && (
              <Button type="button" size="sm" variant="default" className="h-5 text-[10px] gap-0.5 px-1.5"
                onClick={() => onAssignEvidence(index)}>
                <Highlighter className="h-2.5 w-2.5" /> Gán
              </Button>
            )}
          </div>
          {draft.explanation?.evidence ? (
            <div className="relative rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900 whitespace-pre-wrap max-h-14 overflow-y-auto">
              {draft.explanation.evidence}
              <button type="button" onClick={() => onChange({ ...draft, explanation: { ...draft.explanation, evidence: undefined } })}
                className="absolute top-0.5 right-1 text-amber-400 hover:text-amber-600 text-[10px]">✕</button>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 italic pt-0.5">Quét text → bấm &quot;Gán&quot;</p>
          )}
        </div>
      </div>
    </div>
  );
}
