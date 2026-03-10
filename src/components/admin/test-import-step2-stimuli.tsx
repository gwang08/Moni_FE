'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { StimulusCard } from '@/components/admin/test-import-stimulus-card';
import type { StimulusRequest } from '@/types/admin.types';

interface Props {
  stimuli: StimulusRequest[];
  onChange: (stimuli: StimulusRequest[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const emptyStimulus = (section: number): StimulusRequest => ({
  title: '',
  content: '',
  mediaUrl: undefined,
  section,
  questionGroups: [],
});

export function TestImportStep2({ stimuli, onChange, onNext, onBack }: Props) {
  const addStimulus = () => onChange([...stimuli, emptyStimulus(stimuli.length + 1)]);

  const removeStimulus = (idx: number) =>
    onChange(stimuli.filter((_, i) => i !== idx).map((s, i) => ({ ...s, section: i + 1 })));

  const updateStimulus = (idx: number, updated: StimulusRequest) =>
    onChange(stimuli.map((s, i) => (i === idx ? updated : s)));

  const isValid = stimuli.length > 0 && stimuli.every(s => s.content.trim());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Thêm các đoạn văn / bài nghe cho bài thi</p>
        <Button size="sm" variant="outline" onClick={addStimulus}>
          <Plus className="h-4 w-4" /> Thêm stimulus
        </Button>
      </div>

      {stimuli.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
          Chưa có stimulus. Nhấn &quot;Thêm stimulus&quot; để bắt đầu.
        </div>
      )}

      {stimuli.map((stimulus, idx) => (
        <StimulusCard
          key={idx}
          stimulus={stimulus}
          index={idx}
          onChange={updated => updateStimulus(idx, updated)}
          onRemove={() => removeStimulus(idx)}
        />
      ))}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid}>Tiếp theo</Button>
      </div>
    </div>
  );
}
