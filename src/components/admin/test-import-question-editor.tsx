'use client';

import type { ButtonHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { McqOptions } from '@/components/admin/test-import-question-options-mcq';
import { TfngOptions } from '@/components/admin/test-import-question-options-tfng';
import { FillOptions } from '@/components/admin/test-import-question-options-fill';
import { MatchingSharedOptions } from '@/components/admin/test-import-question-options-matching-shared';
import { EvidenceList } from '@/components/admin/evidence-list';
import type { OptionRequest, QuestionRequest, QuestionTypeCode } from '@/types/admin.types';

interface Props {
  question: QuestionRequest;
  questionTypeCode: QuestionTypeCode;
  position: number;
  pendingEvidence: string | null;
  sharedOptions?: { label: string; content: string }[];
  onAssignEvidence: () => void;
  onChange: (updated: QuestionRequest) => void;
  onRemove: () => void;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

function DragDots() {
  return (
    <span className="grid grid-cols-2 gap-[2px]">
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
    </span>
  );
}

export function QuestionEditor({
  question,
  questionTypeCode,
  position,
  pendingEvidence,
  sharedOptions,
  onAssignEvidence,
  onChange,
  onRemove,
  dragHandleProps,
}: Props) {
  const setOptions = (options: OptionRequest[]) => onChange({ ...question, options });

  const handleEvidenceChange = (ev: string | undefined) =>
    onChange({
      ...question,
      explanation: { ...question.explanation, evidence: ev },
    });

  return (
    <div className="group space-y-2 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          draggable
          {...dragHandleProps}
          className={`inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 opacity-0 transition-opacity hover:text-blue-600 group-hover:opacity-100 active:cursor-grabbing ${
            dragHandleProps?.className ?? ''
          }`}
          title="Kéo để sắp xếp"
        >
          <DragDots />
        </button>
        <span className="text-xs font-semibold text-gray-700">Câu {position}</span>
        <Button
          size="icon-sm"
          variant="ghost"
          className="ml-auto h-6 w-6 text-red-400 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <Input
        value={question.content}
        onChange={(e) => onChange({ ...question, content: e.target.value })}
        placeholder="Nội dung câu hỏi"
        className="text-sm"
      />

      {(questionTypeCode === 'MCQ' || questionTypeCode === 'MCQ_MULTIPLE') && (
        <McqOptions options={question.options} onChange={setOptions} multiple={questionTypeCode === 'MCQ_MULTIPLE'} />
      )}
      {(questionTypeCode === 'TFNG' || questionTypeCode === 'YNNG') && (
        <TfngOptions options={question.options} onChange={setOptions} variant={questionTypeCode} />
      )}
      {(questionTypeCode === 'GAP_FILLING' || questionTypeCode === 'DIAGRAM_LABEL') && (
        <FillOptions options={question.options} onChange={setOptions} variant={questionTypeCode} />
      )}
      {['MATCHING_HEADINGS', 'MATCHING_INFORMATION', 'MATCHING_FEATURE'].includes(questionTypeCode) && (
        <MatchingSharedOptions options={question.options} onChange={setOptions} sharedOptions={sharedOptions || []} />
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-1">
        <div>
          <Label className="mb-0.5 block text-xs text-gray-500">Giải thích</Label>
          <textarea
            value={question.explanation?.text ?? ''}
            onChange={(e) => onChange({ ...question, explanation: { ...question.explanation, text: e.target.value || undefined } })}
            placeholder="Tại sao đáp án này đúng?"
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <EvidenceList evidence={question.explanation?.evidence} pendingEvidence={pendingEvidence} onAssign={onAssignEvidence} onChange={handleEvidenceChange} />
      </div>
    </div>
  );
}
