'use client';

import { Input } from '@/components/ui/input';
import type { OptionRequest } from '@/types/admin.types';

interface Props {
  options: OptionRequest[];
  onChange: (options: OptionRequest[]) => void;
}

const LABELS = ['A', 'B', 'C', 'D'];

export function defaultMcqOptions(): OptionRequest[] {
  return LABELS.map(label => ({ label, content: '', isCorrect: false }));
}

export function McqOptions({ options, onChange }: Props) {
  const setCorrect = (idx: number) =>
    onChange(options.map((o, i) => ({ ...o, isCorrect: i === idx })));

  const setContent = (idx: number, content: string) =>
    onChange(options.map((o, i) => (i === idx ? { ...o, content } : o)));

  return (
    <div className="space-y-2">
      {options.map((option, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="radio"
            name={`mcq-${options.map(o => o.label).join('-')}`}
            checked={option.isCorrect}
            onChange={() => setCorrect(idx)}
            className="mt-0.5"
          />
          <span className="text-xs font-semibold text-gray-500 w-5">{option.label}</span>
          <Input
            value={option.content}
            onChange={e => setContent(idx, e.target.value)}
            placeholder={`Đáp án ${option.label}`}
            className="text-sm"
          />
        </div>
      ))}
    </div>
  );
}
