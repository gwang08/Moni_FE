'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  // Auto-create first stimulus if empty
  useEffect(() => {
    if (stimuli.length === 0) onChange([emptyStimulus(1)]);
  }, [stimuli.length, onChange]);

  if (stimuli.length === 0) return null;

  const stimulus = stimuli[0];
  const updateStimulus = (updated: StimulusRequest) => onChange([updated]);
  const isValid = stimulus.content.trim().length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex min-h-0 flex-1 flex-col">
        <StimulusCard
          stimulus={stimulus}
          onChange={updateStimulus}
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid}>Tiếp theo</Button>
      </div>
    </div>
  );
}
