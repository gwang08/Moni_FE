'use client';

import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { GapSentenceInput, extractAnswer } from '@/components/admin/gap-sentence-input';
import type { QuestionRequest } from '@/types/admin.types';

interface Props {
  questions: QuestionRequest[];
  positionOffset: number;
  onChange: (questions: QuestionRequest[]) => void;
}

export function GapFillingEditor({ questions, positionOffset, onChange }: Props) {
  const addQuestion = () => {
    onChange([...questions, { content: '', options: [{ label: '', content: '', isCorrect: true }] }]);
  };

  const removeQuestion = (idx: number) => {
    onChange(questions.filter((_, i) => i !== idx));
  };

  const updateContent = (idx: number, content: string) => {
    const answer = extractAnswer(content);
    const options = [{ label: '', content: answer, isCorrect: true }];
    onChange(questions.map((q, i) => (i === idx ? { ...q, content, options } : q)));
  };

  return (
    <div className="space-y-2">
      {questions.map((q, idx) => (
        <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Câu {positionOffset + idx + 1}</span>
            {questions.length > 1 && (
              <button type="button" onClick={() => removeQuestion(idx)} className="text-gray-300 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <GapSentenceInput
            value={q.content}
            onChange={val => updateContent(idx, val)}
            placeholder="VD: The tomato is thought to have first grown in the Americas."
          />
        </div>
      ))}

      <Button type="button" size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={addQuestion}>
        <Plus className="h-3 w-3" /> Thêm câu
      </Button>
    </div>
  );
}
