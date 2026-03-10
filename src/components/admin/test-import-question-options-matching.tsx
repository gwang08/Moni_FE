'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { OptionRequest } from '@/types/admin.types';

interface Props {
  options: OptionRequest[];
  onChange: (options: OptionRequest[]) => void;
}

export function defaultMatchingOptions(): OptionRequest[] {
  return [{ label: '', content: '', isCorrect: true }];
}

export function MatchingOptions({ options, onChange }: Props) {
  const addPair = () =>
    onChange([...options, { label: '', content: '', isCorrect: true }]);

  const removePair = (idx: number) =>
    onChange(options.filter((_, i) => i !== idx));

  const update = (idx: number, key: 'label' | 'content', value: string) =>
    onChange(options.map((o, i) => (i === idx ? { ...o, [key]: value } : o)));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <span className="flex-1">Câu hỏi / Heading</span>
        <span className="flex-1">Đáp án</span>
        <span className="w-8" />
      </div>
      {options.map((option, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            value={option.label ?? ''}
            onChange={e => update(idx, 'label', e.target.value)}
            placeholder="VD: Paragraph A"
            className="text-sm flex-1"
          />
          <Input
            value={option.content}
            onChange={e => update(idx, 'content', e.target.value)}
            placeholder="VD: Heading iii"
            className="text-sm flex-1"
          />
          <Button size="icon-sm" variant="ghost" className="text-red-500" onClick={() => removePair(idx)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={addPair} className="text-xs">
        <Plus className="h-3 w-3" /> Thêm cặp
      </Button>
    </div>
  );
}
