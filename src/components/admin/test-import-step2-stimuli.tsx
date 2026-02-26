'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import type { StimulusRequest } from '@/types/admin.types';

interface Props {
  stimuli: StimulusRequest[];
  onChange: (stimuli: StimulusRequest[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const emptyStimulus = (orderIndex: number): StimulusRequest => ({
  content: '',
  mediaUrl: '',
  orderIndex,
  questions: [],
});

export function TestImportStep2({ stimuli, onChange, onNext, onBack }: Props) {
  const addStimulus = () => onChange([...stimuli, emptyStimulus(stimuli.length)]);

  const removeStimulus = (idx: number) =>
    onChange(stimuli.filter((_, i) => i !== idx).map((s, i) => ({ ...s, orderIndex: i })));

  const updateStimulusContent = (idx: number, value: string) =>
    onChange(stimuli.map((s, i) => i === idx ? { ...s, content: value } : s));

  const updateStimulusMedia = (idx: number, value: string) =>
    onChange(stimuli.map((s, i) => i === idx ? { ...s, mediaUrl: value } : s));

  const isValid = stimuli.length > 0 && stimuli.every(s => s.content.trim());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Thêm các đoạn văn bản / stimulus cho bài thi</p>
        <Button size="sm" variant="outline" onClick={addStimulus}>
          <Plus className="h-4 w-4" /> Thêm stimulus
        </Button>
      </div>

      {stimuli.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
          Chưa có stimulus. Nhấn "Thêm stimulus" để bắt đầu.
        </div>
      )}

      {stimuli.map((stimulus, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Stimulus #{idx + 1}</span>
            <Button size="icon-sm" variant="ghost" className="text-red-500" onClick={() => removeStimulus(idx)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <Label className="mb-1 block text-xs">Nội dung *</Label>
            <textarea
              value={stimulus.content}
              onChange={e => updateStimulusContent(idx, e.target.value)}
              placeholder="Nhập nội dung stimulus"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div>
            <Label className="mb-1 block text-xs">URL Media (tùy chọn)</Label>
            <Input
              value={stimulus.mediaUrl || ''}
              onChange={e => updateStimulusMedia(idx, e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      ))}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid}>Tiếp theo</Button>
      </div>
    </div>
  );
}
