'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { McqOptions } from '@/components/admin/test-import-question-options-mcq';
import { TfngOptions } from '@/components/admin/test-import-question-options-tfng';
import { FillOptions } from '@/components/admin/test-import-question-options-fill';
import type { QuestionTypeCode } from '@/types/admin.types';
import type { QuestionDraft } from '@/components/admin/test-edit-add-question-group-form';

interface Props {
  index: number;
  draft: QuestionDraft;
  typeCode: QuestionTypeCode;
  onChange: (draft: QuestionDraft) => void;
  onRemove?: () => void;
}

export function TestEditQuestionDraftCard({ index, draft, typeCode, onChange, onRemove }: Props) {
  return (
    <div className="bg-white rounded-md border border-gray-200 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 shrink-0">Câu {index + 1}</span>
        <Input value={draft.content} onChange={e => onChange({ ...draft, content: e.target.value })}
          placeholder="Nội dung câu hỏi..." className="text-xs h-7 flex-1" />
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-gray-300 hover:text-red-500 shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="pl-[52px]">
        <Label className="mb-1 block text-[10px] text-gray-400 uppercase tracking-wide">Đáp án</Label>

        {(typeCode === 'MCQ' || typeCode === 'MCQ_MULTIPLE') && (
          <McqOptions options={draft.options} onChange={opts => onChange({ ...draft, options: opts })}
            multiple={typeCode === 'MCQ_MULTIPLE'} />
        )}

        {(typeCode === 'TFNG' || typeCode === 'YNNG') && (
          <TfngOptions options={draft.options} onChange={opts => onChange({ ...draft, options: opts })}
            variant={typeCode} />
        )}

        {(typeCode === 'GAP_FILLING' || typeCode === 'DIAGRAM_LABEL') && (
          <FillOptions options={draft.options} onChange={opts => onChange({ ...draft, options: opts })}
            variant={typeCode} />
        )}

        {(typeCode === 'MATCHING_HEADINGS' || typeCode === 'MATCHING_INFORMATION' || typeCode === 'MATCHING_FEATURE') && (
          <Input value={draft.options[0]?.content ?? ''} onChange={e => onChange({
            ...draft, options: [{ label: draft.options[0]?.label ?? 'A', content: e.target.value, isCorrect: true }],
          })} placeholder="Đáp án đúng..." className="text-xs h-7" />
        )}
      </div>
    </div>
  );
}
