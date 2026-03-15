'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { McqOptions } from '@/components/admin/test-import-question-options-mcq';
import { TfngOptions } from '@/components/admin/test-import-question-options-tfng';
import { FillOptions } from '@/components/admin/test-import-question-options-fill';
import { MatchingSharedOptions } from '@/components/admin/test-import-question-options-matching-shared';
import { EvidenceList } from '@/components/admin/evidence-list';
import type { QuestionRequest, QuestionTypeCode, OptionRequest } from '@/types/admin.types';

interface Props {
  question: QuestionRequest;
  questionTypeCode: QuestionTypeCode;
  position: number;
  pendingEvidence: string | null;
  sharedOptions?: { label: string; content: string }[];
  onAssignEvidence: () => void;
  onChange: (updated: QuestionRequest) => void;
  onRemove: () => void;
}

export function QuestionEditor({ question, questionTypeCode, position, pendingEvidence, sharedOptions, onAssignEvidence, onChange, onRemove }: Props) {
  const setOptions = (options: OptionRequest[]) => onChange({ ...question, options });

  const handleEvidenceChange = (ev: string | undefined) => onChange({
    ...question,
    explanation: { ...question.explanation, evidence: ev },
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">Câu {position}</span>
        <Button size="icon-sm" variant="ghost" className="text-red-400 h-6 w-6" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Question content */}
      <Input
        value={question.content}
        onChange={e => onChange({ ...question, content: e.target.value })}
        placeholder="Nội dung câu hỏi"
        className="text-sm"
      />

      {/* Options */}
      {(questionTypeCode === 'MCQ' || questionTypeCode === 'MCQ_MULTIPLE') && (
        <McqOptions options={question.options} onChange={setOptions} multiple={questionTypeCode === 'MCQ_MULTIPLE'} />
      )}
      {(questionTypeCode === 'TFNG' || questionTypeCode === 'YNNG') && (
        <TfngOptions options={question.options} onChange={setOptions} variant={questionTypeCode} />
      )}
      {(questionTypeCode === 'GAP_FILLING' || questionTypeCode === 'DIAGRAM_LABEL') && (
        <FillOptions options={question.options} onChange={setOptions} variant={questionTypeCode} />
      )}
      {(['MATCHING_HEADINGS', 'MATCHING_INFORMATION', 'MATCHING_FEATURE'].includes(questionTypeCode)) && (
        <MatchingSharedOptions options={question.options} onChange={setOptions} sharedOptions={sharedOptions || []} />
      )}

      {/* Explanation + Evidence — compact */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
        <div>
          <Label className="mb-0.5 block text-xs text-gray-500">Giải thích</Label>
          <textarea
            value={question.explanation?.text ?? ''}
            onChange={e => onChange({ ...question, explanation: { ...question.explanation, text: e.target.value || undefined } })}
            placeholder="Tại sao đáp án này đúng?"
            rows={2}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>
        <EvidenceList
          evidence={question.explanation?.evidence}
          pendingEvidence={pendingEvidence}
          onAssign={onAssignEvidence}
          onChange={handleEvidenceChange}
        />
      </div>
    </div>
  );
}
