'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OptionRequest } from '@/types/admin.types';

interface Props {
  options: OptionRequest[];
  onChange: (options: OptionRequest[]) => void;
  variant: string;
}

export function defaultFillOptions(): OptionRequest[] {
  return [{ label: '', content: '', isCorrect: true }];
}

export function FillOptions({ options, onChange, variant }: Props) {
  const answer = options[0]?.content ?? '';

  const setAnswer = (content: string) =>
    onChange([{ label: '', content, isCorrect: true }]);

  const placeholder = variant === 'FILL_IN_THE_BLANK'
    ? 'Nhập đáp án (dùng | để phân cách nhiều đáp án, vd: morning|in the morning)'
    : 'Nhập câu trả lời (dùng | nếu có nhiều đáp án)';

  return (
    <div>
      <Label className="mb-1 block text-xs text-gray-500">Đáp án đúng</Label>
      <Input value={answer} onChange={e => setAnswer(e.target.value)} placeholder={placeholder} className="text-sm" />
    </div>
  );
}
