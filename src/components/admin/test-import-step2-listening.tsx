'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StimulusCard } from '@/components/admin/test-import-stimulus-card';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { X, Music, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { transcribeByUrl } from '@/lib/admin-api';
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

/** Convert transcript segments to plain HTML for the TipTap editor */
function segmentsToHtml(segments: { text: string; speaker?: string }[]): string {
  return segments
    .map((seg) => {
      const speaker = seg.speaker ? `<strong>${seg.speaker}:</strong> ` : '';
      return `<p>${speaker}${seg.text}</p>`;
    })
    .join('');
}

export function TestImportStep2Listening({ stimuli, onChange, onNext, onBack }: Props) {
  const [transcribing, setTranscribing] = useState(false);

  useEffect(() => {
    if (stimuli.length === 0) onChange([emptyStimulus(1)]);
  }, [stimuli.length, onChange]);

  if (stimuli.length === 0) return null;

  const stimulus = stimuli[0];
  const updateStimulus = (updated: StimulusRequest) => onChange([updated]);
  const isValid = stimulus.content.trim().length > 0;

  const handleAutoTranscribe = async () => {
    if (!stimulus.mediaUrl) return;
    setTranscribing(true);
    try {
      const segments = await transcribeByUrl(stimulus.mediaUrl);
      const html = segmentsToHtml(segments);
      updateStimulus({ ...stimulus, content: html });
      toast.success('Đã tạo transcript tự động. Kiểm tra và chỉnh sửa nếu cần.');
    } catch {
      toast.error('Tạo transcript thất bại. Kiểm tra API key hoặc thử lại.');
    } finally {
      setTranscribing(false);
    }
  };

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
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Nội dung bài nghe</label>
          {stimulus.mediaUrl && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              disabled={transcribing}
              onClick={handleAutoTranscribe}
            >
              {transcribing
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Sparkles className="h-3 w-3" />}
              {transcribing ? 'Đang tạo...' : 'Tự động tạo transcript'}
            </Button>
          )}
        </div>

        {transcribing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-blue-700 font-medium">Đang phân tích audio với AssemblyAI...</p>
            <p className="text-xs text-blue-500 mt-1">Quá trình này có thể mất 1-3 phút</p>
          </div>
        )}

        <StimulusCard stimulus={stimulus} index={0} onChange={updateStimulus} />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid}>Tiếp theo</Button>
      </div>
    </div>
  );
}
