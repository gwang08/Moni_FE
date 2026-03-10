'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { QuestionEditor } from '@/components/admin/test-import-question-editor';
import { defaultMcqOptions } from '@/components/admin/test-import-question-options-mcq';
import { defaultTfngOptions } from '@/components/admin/test-import-question-options-tfng';
import { defaultFillOptions } from '@/components/admin/test-import-question-options-fill';
import { defaultMatchingOptions } from '@/components/admin/test-import-question-options-matching';
import type { QuestionGroupRequest, QuestionRequest, QuestionTypeCode, OptionRequest } from '@/types/admin.types';

interface Props {
  group: QuestionGroupRequest;
  groupIndex: number;
  positionOffset: number;
  pendingEvidence: string | null;
  onAssignEvidence: (qi: number) => void;
  onChange: (updated: QuestionGroupRequest) => void;
  onRemove: () => void;
}

const QUESTION_TYPES: { value: QuestionTypeCode; label: string; instruction: string }[] = [
  { value: 'MCQ', label: 'Trắc nghiệm (MCQ)', instruction: 'Choose the correct letter A, B, C or D.' },
  { value: 'TFNG', label: 'True / False / Not Given', instruction: 'Do the following statements agree with the information given in the reading passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.' },
  { value: 'YNNG', label: 'Yes / No / Not Given', instruction: 'Do the following statements agree with the views of the writer? Write YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.' },
  { value: 'MATCHING', label: 'Nối đáp án (Matching)', instruction: 'Match each statement with the correct option.' },
  { value: 'FILL_IN_THE_BLANK', label: 'Điền từ vào chỗ trống', instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.' },
  { value: 'SHORT_ANSWER', label: 'Trả lời ngắn', instruction: 'Answer the questions below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER from the passage for each answer.' },
];

function getDefaultOptions(typeCode: QuestionTypeCode): OptionRequest[] {
  switch (typeCode) {
    case 'MCQ': case 'MCQ_MULTIPLE': return defaultMcqOptions();
    case 'TFNG': return defaultTfngOptions('TFNG');
    case 'YNNG': return defaultTfngOptions('YNNG');
    case 'FILL_IN_THE_BLANK': case 'SHORT_ANSWER': return defaultFillOptions();
    case 'MATCHING': return defaultMatchingOptions();
    default: return [];
  }
}

function emptyQuestion(typeCode: QuestionTypeCode): QuestionRequest {
  return { content: '', options: getDefaultOptions(typeCode) };
}

export function QuestionGroupEditor({ group, groupIndex, positionOffset, pendingEvidence, onAssignEvidence, onChange, onRemove }: Props) {
  const [idx, setIdx] = useState(0);
  const total = group.questions.length;
  const current = group.questions[idx];

  const handleTypeChange = (typeCode: QuestionTypeCode) => {
    const matched = QUESTION_TYPES.find(t => t.value === typeCode);
    const updatedQuestions = group.questions.map(q => ({ ...q, options: getDefaultOptions(typeCode) }));
    onChange({ ...group, questionTypeCode: typeCode, instruction: matched?.instruction, questions: updatedQuestions });
  };

  const addQuestion = () => {
    const next = [...group.questions, emptyQuestion(group.questionTypeCode)];
    onChange({ ...group, questions: next });
    setIdx(next.length - 1);
  };

  const removeQuestion = () => {
    const next = group.questions.filter((_, i) => i !== idx);
    onChange({ ...group, questions: next });
    setIdx(Math.min(idx, Math.max(0, next.length - 1)));
  };

  const updateQuestion = (updated: QuestionRequest) =>
    onChange({ ...group, questions: group.questions.map((q, i) => (i === idx ? updated : q)) });

  return (
    <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-blue-700">Nhóm {groupIndex + 1}</span>
        <Button size="icon-sm" variant="ghost" className="text-red-500" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Type selector */}
      <div>
        <Label className="mb-1 block text-xs">Loại câu hỏi *</Label>
        <select
          value={group.questionTypeCode}
          onChange={e => handleTypeChange(e.target.value as QuestionTypeCode)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {group.instruction && (
        <p className="text-xs text-gray-500 italic bg-gray-100 rounded px-2 py-1.5">{group.instruction}</p>
      )}

      {/* Navigation: ◀ Câu 1/5 ▶  [Xóa] [+ Thêm] */}
      <div className="flex items-center justify-between bg-white rounded-md border px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          <Button size="icon-sm" variant="ghost" disabled={idx <= 0} onClick={() => setIdx(idx - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-gray-600 min-w-[70px] text-center">
            {total > 0 ? `Câu ${idx + 1} / ${total}` : 'Chưa có câu'}
          </span>
          <Button size="icon-sm" variant="ghost" disabled={idx >= total - 1} onClick={() => setIdx(idx + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          {total > 0 && (
            <Button size="sm" variant="ghost" className="text-red-500 text-xs h-6 px-2" onClick={removeQuestion}>
              <Trash2 className="h-3 w-3" /> Xóa
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-xs h-6 px-2" onClick={addQuestion}>
            <Plus className="h-3 w-3" /> Thêm
          </Button>
        </div>
      </div>

      {/* Single question */}
      {current && (
        <QuestionEditor
          question={current}
          questionTypeCode={group.questionTypeCode}
          position={positionOffset + idx + 1}
          pendingEvidence={pendingEvidence}
          onAssignEvidence={() => onAssignEvidence(idx)}
          onChange={updateQuestion}
          onRemove={removeQuestion}
        />
      )}
    </div>
  );
}
