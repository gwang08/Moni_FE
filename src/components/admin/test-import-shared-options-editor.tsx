'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface SharedOption {
  label: string;
  content: string;
}

interface Props {
  options: SharedOption[];
  onChange: (options: SharedOption[]) => void;
  labelPrefix?: string; // "i", "ii" for headings or "A", "B" for features
}

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];

export function SharedOptionsEditor({ options, onChange, labelPrefix = 'roman' }: Props) {
  const getNextLabel = (idx: number) =>
    labelPrefix === 'roman' ? ROMAN[idx] || `${idx + 1}` : String.fromCharCode(65 + idx);

  const addOption = () => {
    const label = getNextLabel(options.length);
    onChange([...options, { label, content: '' }]);
  };

  const removeOption = (idx: number) => {
    const next = options.filter((_, i) => i !== idx).map((o, i) => ({ ...o, label: getNextLabel(i) }));
    onChange(next);
  };

  const updateContent = (idx: number, content: string) =>
    onChange(options.map((o, i) => (i === idx ? { ...o, content } : o)));

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
      <Label className="block text-xs font-semibold text-amber-800">
        Danh sách đáp án chung ({options.length})
      </Label>
      {options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-700 w-6 text-center shrink-0">{opt.label}</span>
          <Input
            value={opt.content}
            onChange={e => updateContent(idx, e.target.value)}
            placeholder={`Nội dung đáp án ${opt.label}`}
            className="text-sm flex-1"
          />
          {options.length > 1 && (
            <button type="button" onClick={() => removeOption(idx)} className="text-amber-400 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      <Button type="button" size="sm" variant="ghost" className="text-xs h-7 gap-1 text-amber-700" onClick={addOption}>
        <Plus className="h-3 w-3" /> Thêm đáp án
      </Button>
    </div>
  );
}
