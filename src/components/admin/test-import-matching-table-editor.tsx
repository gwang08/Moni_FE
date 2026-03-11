'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { QuestionRequest } from '@/types/admin.types';

interface SharedOption {
  label: string;
  content: string;
}

interface Props {
  questions: QuestionRequest[];
  sharedOptions: SharedOption[];
  positionOffset: number;
  onChange: (questions: QuestionRequest[]) => void;
}

export function MatchingTableEditor({ questions, sharedOptions, positionOffset, onChange }: Props) {
  const addQuestion = () => {
    onChange([...questions, { content: '', options: [] }]);
  };

  const removeQuestion = (idx: number) => {
    onChange(questions.filter((_, i) => i !== idx));
  };

  const updateContent = (idx: number, content: string) => {
    onChange(questions.map((q, i) => (i === idx ? { ...q, content } : q)));
  };

  const updateAnswer = (idx: number, correctLabel: string) => {
    // Store ALL shared options so backend creates option rows for each → enables practice grading
    const options = correctLabel
      ? sharedOptions.map(opt => ({ label: opt.label, content: opt.content, isCorrect: opt.label === correctLabel }))
      : [];
    onChange(questions.map((q, i) => (i === idx ? { ...q, options } : q)));
  };

  return (
    <div className="space-y-2">
      {/* Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_160px_32px] bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-500 border-b">
          <span>#</span>
          <span>Nội dung câu hỏi</span>
          <span>Đáp án</span>
          <span />
        </div>

        {/* Rows */}
        {questions.map((q, idx) => (
          <div key={idx} className="grid grid-cols-[40px_1fr_160px_32px] items-center px-2 py-1.5 border-b last:border-b-0 hover:bg-gray-50/50 gap-1">
            <span className="text-xs font-semibold text-gray-400">{positionOffset + idx + 1}</span>
            <Input
              value={q.content}
              onChange={e => updateContent(idx, e.target.value)}
              placeholder="VD: Paragraph A / Statement about..."
              className="text-sm h-8"
            />
            <select
              value={q.options.find(o => o.isCorrect)?.label || ''}
              onChange={e => updateAnswer(idx, e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">--</option>
              {sharedOptions.map(opt => (
                <option key={opt.label} value={opt.label}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => removeQuestion(idx)} className="text-gray-300 hover:text-red-500 justify-self-center">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-gray-400">Chưa có câu hỏi</div>
        )}
      </div>

      <Button type="button" size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={addQuestion}>
        <Plus className="h-3 w-3" /> Thêm câu
      </Button>
    </div>
  );
}
