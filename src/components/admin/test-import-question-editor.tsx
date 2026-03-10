'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Highlighter } from 'lucide-react';
import { McqOptions } from '@/components/admin/test-import-question-options-mcq';
import { TfngOptions } from '@/components/admin/test-import-question-options-tfng';
import { FillOptions } from '@/components/admin/test-import-question-options-fill';
import { MatchingOptions } from '@/components/admin/test-import-question-options-matching';
import type { QuestionRequest, QuestionTypeCode, OptionRequest } from '@/types/admin.types';

interface Props {
  question: QuestionRequest;
  questionTypeCode: QuestionTypeCode;
  position: number;
  pendingEvidence: string | null;
  onAssignEvidence: () => void;
  onChange: (updated: QuestionRequest) => void;
  onRemove: () => void;
}

export function QuestionEditor({ question, questionTypeCode, position, pendingEvidence, onAssignEvidence, onChange, onRemove }: Props) {
  const setOptions = (options: OptionRequest[]) => onChange({ ...question, options });

  const clearEvidence = () => onChange({
    ...question,
    explanation: { ...question.explanation, evidence: undefined },
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
        <McqOptions options={question.options} onChange={setOptions} />
      )}
      {(questionTypeCode === 'TFNG' || questionTypeCode === 'YNNG') && (
        <TfngOptions options={question.options} onChange={setOptions} variant={questionTypeCode} />
      )}
      {(questionTypeCode === 'FILL_IN_THE_BLANK' || questionTypeCode === 'SHORT_ANSWER') && (
        <FillOptions options={question.options} onChange={setOptions} variant={questionTypeCode} />
      )}
      {questionTypeCode === 'MATCHING' && (
        <MatchingOptions options={question.options} onChange={setOptions} />
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
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <Label className="block text-xs text-gray-500">Dẫn chứng</Label>
            {pendingEvidence && (
              <Button type="button" size="sm" variant="default" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={onAssignEvidence}>
                <Highlighter className="h-2.5 w-2.5" /> Gán vào câu này
              </Button>
            )}
          </div>
          {question.explanation?.evidence ? (
            <div className="relative rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900 whitespace-pre-wrap max-h-16 overflow-y-auto">
              {question.explanation.evidence}
              <button type="button" onClick={clearEvidence} className="absolute top-0.5 right-1 text-amber-400 hover:text-amber-600 text-xs">✕</button>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 italic pt-1">Quét text bài đọc bên phải → bấm &quot;Gán vào câu này&quot;</p>
          )}
        </div>
      </div>
    </div>
  );
}
