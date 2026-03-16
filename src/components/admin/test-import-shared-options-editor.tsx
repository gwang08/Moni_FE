'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ClipboardPaste } from 'lucide-react';

interface SharedOption {
  label: string;
  content: string;
}

interface Props {
  options: SharedOption[];
  onChange: (options: SharedOption[]) => void;
  labelPrefix?: string; // "roman" for i,ii,iii or "alpha" for A,B,C
  usageCounts?: Record<string, number>; // label → count of questions using it
}

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];

export function SharedOptionsEditor({ options, onChange, labelPrefix = 'roman', usageCounts }: Props) {
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');

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

  const handleBulkPaste = () => {
    const lines = pasteText.split('\n').map(l => l.replace(/^[a-z]+\.\s*|^\d+\.\s*|^[ivx]+\.\s*/i, '').trim()).filter(Boolean);
    if (lines.length === 0) return;
    const newOptions = lines.map((content, i) => ({ label: getNextLabel(i), content }));
    onChange(newOptions);
    setPasteText('');
    setShowPaste(false);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Label className="block text-xs font-semibold text-amber-800">
          Danh sách đáp án chung ({options.length})
        </Label>
        <Button type="button" size="sm" variant="ghost" className="text-[10px] h-6 gap-0.5 text-amber-600"
          onClick={() => setShowPaste(!showPaste)}>
          <ClipboardPaste className="h-3 w-3" /> Dán danh sách
        </Button>
      </div>

      {/* Bulk paste area */}
      {showPaste && (
        <div className="space-y-1.5 bg-white rounded-md border border-amber-200 p-2">
          <p className="text-[10px] text-gray-500">Dán danh sách đáp án (mỗi dòng 1 đáp án):</p>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder={"The invention of writing\nThe move towards literacy\nThe failure of early systems"}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <div className="flex gap-1.5">
            <Button type="button" size="sm" className="text-[10px] h-6" onClick={handleBulkPaste}>
              Áp dụng ({pasteText.split('\n').filter(l => l.trim()).length} mục)
            </Button>
            <Button type="button" size="sm" variant="ghost" className="text-[10px] h-6" onClick={() => { setShowPaste(false); setPasteText(''); }}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {options.map((opt, idx) => {
        const count = usageCounts?.[opt.label];
        return (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 w-6 text-center shrink-0">{opt.label}</span>
            <Input
              value={opt.content}
              onChange={e => updateContent(idx, e.target.value)}
              placeholder={`Nội dung đáp án ${opt.label}`}
              className="text-sm flex-1"
            />
            {count != null && count > 0 && (
              <span className="text-[9px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full shrink-0">
                {count} câu
              </span>
            )}
            {options.length > 1 && (
              <button type="button" onClick={() => removeOption(idx)} className="text-amber-400 hover:text-red-500 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
      <Button type="button" size="sm" variant="ghost" className="text-xs h-7 gap-1 text-amber-700" onClick={addOption}>
        <Plus className="h-3 w-3" /> Thêm đáp án
      </Button>
    </div>
  );
}
