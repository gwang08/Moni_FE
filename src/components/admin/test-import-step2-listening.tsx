'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StimulusCard } from '@/components/admin/test-import-stimulus-card';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { X, Music } from 'lucide-react';
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

export function TestImportStep2Listening({ stimuli, onChange, onNext, onBack }: Props) {
  useEffect(() => {
    if (stimuli.length === 0) onChange([emptyStimulus(1)]);
  }, [stimuli.length, onChange]);

  if (stimuli.length === 0) return null;

  const stimulus = stimuli[0];
  const updateStimulus = (updated: StimulusRequest) => onChange([updated]);
  const isValid = stimulus.content.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Audio Upload */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">File audio</label>
        {stimulus.mediaUrl ? (
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
            <Music className="h-5 w-5 text-purple-600 shrink-0" />
            <audio controls src={stimulus.mediaUrl} className="flex-1 h-8" />
            <button
              type="button"
              onClick={() => updateStimulus({ ...stimulus, mediaUrl: undefined })}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <MediaUploadZone
            onUploaded={(url) => updateStimulus({ ...stimulus, mediaUrl: url })}
          />
        )}
      </div>

      {/* Rich text content (passage/transcript) */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Nội dung bài nghe</label>
        <StimulusCard stimulus={stimulus} index={0} onChange={updateStimulus} />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid}>Tiếp theo</Button>
      </div>
    </div>
  );
}
