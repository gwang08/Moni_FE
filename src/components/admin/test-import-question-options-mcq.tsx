'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { OptionRequest } from '@/types/admin.types';

interface Props {
  options: OptionRequest[];
  onChange: (options: OptionRequest[]) => void;
  multiple?: boolean;
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function defaultMcqOptions(): OptionRequest[] {
  return LABELS.slice(0, 4).map(label => ({ label, content: '', isCorrect: false }));
}

export function McqOptions({ options, onChange, multiple = false }: Props) {
  // Radio: only one correct
  const setCorrectRadio = (idx: number) =>
    onChange(options.map((o, i) => ({ ...o, isCorrect: i === idx })));

  // Checkbox: toggle individual
  const toggleCorrect = (idx: number) =>
    onChange(options.map((o, i) => (i === idx ? { ...o, isCorrect: !o.isCorrect } : o)));

  const setContent = (idx: number, content: string) =>
    onChange(options.map((o, i) => (i === idx ? { ...o, content } : o)));

  const addOption = () => {
    const nextLabel = LABELS[options.length] || String.fromCharCode(65 + options.length);
    onChange([...options, { label: nextLabel, content: '', isCorrect: false }]);
  };

  const removeOption = (idx: number) => {
    const next = options.filter((_, i) => i !== idx).map((o, i) => ({ ...o, label: LABELS[i] || String.fromCharCode(65 + i) }));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {options.map((option, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type={multiple ? 'checkbox' : 'radio'}
            name={multiple ? undefined : `mcq-${options.map(o => o.label).join('-')}`}
            checked={option.isCorrect}
            onChange={() => multiple ? toggleCorrect(idx) : setCorrectRadio(idx)}
            className="mt-0.5"
          />
          <span className="text-xs font-semibold text-gray-500 w-5">{option.label}</span>
          <Input
            value={option.content}
            onChange={e => setContent(idx, e.target.value)}
            placeholder={`Đáp án ${option.label}`}
            className="text-sm"
          />
          {options.length > 2 && (
            <button type="button" onClick={() => removeOption(idx)} className="text-gray-400 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {options.length < LABELS.length && (
        <Button type="button" size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={addOption}>
          <Plus className="h-3 w-3" /> Thêm đáp án
        </Button>
      )}
    </div>
  );
}
