'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import type { OptionRequest } from '@/types/admin.types';

interface Props {
  options: OptionRequest[];
  onChange: (options: OptionRequest[]) => void;
  variant: string;
}

export function defaultFillOptions(): OptionRequest[] {
  return [{ label: '', content: '', isCorrect: true }];
}

export function FillOptions({ options, onChange }: Props) {
  // Parse "|" separated answers into array for UI
  const rawContent = options[0]?.content ?? '';
  const answers = rawContent ? rawContent.split('|').map(a => a.trim()) : [''];

  const updateAnswers = (newAnswers: string[]) => {
    const joined = newAnswers.filter(a => a.trim()).join('|');
    onChange([{ label: '', content: joined, isCorrect: true }]);
  };

  const setAnswer = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    updateAnswers(updated);
  };

  const addAnswer = () => {
    updateAnswers([...answers, '']);
  };

  const removeAnswer = (index: number) => {
    if (answers.length <= 1) return;
    updateAnswers(answers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label className="mb-1 block text-xs text-gray-500">Đáp án đúng</Label>
      {answers.map((answer, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}.</span>
          <Input
            value={answer}
            onChange={e => setAnswer(i, e.target.value)}
            placeholder={i === 0 ? 'Đáp án chính' : 'Đáp án thay thế'}
            className="text-sm flex-1"
          />
          {answers.length > 1 && (
            <button type="button" onClick={() => removeAnswer(i)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={addAnswer} className="text-xs gap-1 text-primary">
        <Plus className="h-3 w-3" /> Thêm đáp án thay thế
      </Button>
    </div>
  );
}
