'use client';

import { Label } from '@/components/ui/label';
import type { OptionRequest } from '@/types/admin.types';

interface SharedOption {
  label: string;
  content: string;
}

interface Props {
  options: OptionRequest[];
  onChange: (options: OptionRequest[]) => void;
  sharedOptions: SharedOption[];
}

/** Per-question dropdown that picks the correct answer from shared options */
export function MatchingSharedOptions({ options, onChange, sharedOptions }: Props) {
  const currentLabel = options[0]?.content || '';

  const setAnswer = (label: string) => {
    const matched = sharedOptions.find(o => o.label === label);
    onChange([{ label, content: matched?.content || label, isCorrect: true }]);
  };

  return (
    <div>
      <Label className="mb-1 block text-xs text-gray-500">Đáp án đúng</Label>
      {sharedOptions.length === 0 ? (
        <p className="text-xs text-orange-500 italic">Chưa có danh sách đáp án chung. Thêm ở phần trên.</p>
      ) : (
        <select
          value={options[0]?.label || ''}
          onChange={e => setAnswer(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">-- Chọn đáp án --</option>
          {sharedOptions.map(opt => (
            <option key={opt.label} value={opt.label}>
              {opt.label}. {opt.content || '(chưa nhập)'}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
