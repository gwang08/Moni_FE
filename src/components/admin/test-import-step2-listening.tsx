'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StimulusCard } from '@/components/admin/test-import-stimulus-card';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { X, Music, Loader2 } from 'lucide-react';
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

/** Convert transcript segments to HTML for the TipTap editor */
function segmentsToHtml(segments: { text: string; speaker?: string; startTime?: number; endTime?: number }[]): string {
  return segments
    .map((seg) => {
      const speaker = seg.speaker ? `<strong>${seg.speaker}:</strong> ` : '';
      const attrs = [
        'data-transcript-segment="true"',
        Number.isFinite(seg.startTime) ? `data-start-time="${seg.startTime}"` : '',
        Number.isFinite(seg.endTime) ? `data-end-time="${seg.endTime}"` : '',
      ].filter(Boolean).join(' ');
      return `<p ${attrs}>${speaker}${seg.text}</p>`;
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

  const handleAutoTranscribe = async (audioUrl?: string) => {
    const targetUrl = audioUrl || stimulus.mediaUrl;
    if (!targetUrl) return;
    setTranscribing(true);
    try {
      const segments = await transcribeByUrl(targetUrl);
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
    <div className="flex min-h-0 flex-1 flex-col gap-5">
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
            onUploaded={async (url) => {
              updateStimulus({ ...stimulus, mediaUrl: url });
              await handleAutoTranscribe(url);
            }}
          />
        )}
      </div>

      {/* Rich text content (passage/transcript) */}
      <div className="flex min-h-0 flex-1 flex-col">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Nội dung bài nghe</label>

        {transcribing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-blue-700 font-medium">Đang phân tích audio với AssemblyAI...</p>
            <p className="text-xs text-blue-500 mt-1">Quá trình này có thể mất 1-3 phút</p>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <StimulusCard stimulus={stimulus} onChange={updateStimulus} />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid}>Tiếp theo</Button>
      </div>
    </div>
  );
}
