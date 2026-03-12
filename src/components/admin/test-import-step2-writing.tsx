'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { X, Image as ImageIcon } from 'lucide-react';
import type { StimulusRequest } from '@/types/admin.types';

interface Props {
  stimuli: StimulusRequest[];
  onChange: (stimuli: StimulusRequest[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const emptyStimulus = (): StimulusRequest => ({
  title: '',
  content: '',
  mediaUrl: undefined,
  section: 1,
  questionGroups: [],
});

export function TestImportStep2Writing({ stimuli, onChange, onNext, onBack }: Props) {
  useEffect(() => {
    if (stimuli.length === 0) onChange([emptyStimulus()]);
  }, [stimuli.length, onChange]);

  if (stimuli.length === 0) return null;

  const stimulus = stimuli[0];
  const update = (patch: Partial<StimulusRequest>) => onChange([{ ...stimulus, ...patch }]);
  const isValid = stimulus.content.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Prompt */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Đề bài Writing</label>
        <textarea
          value={stimulus.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder="Nhập đề bài cho thí sinh..."
          rows={6}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Chart/Image Upload (Task 1) */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Biểu đồ / Hình ảnh (Task 1 - tuỳ chọn)
        </label>
        {stimulus.mediaUrl ? (
          <div className="relative inline-block">
            <img
              src={stimulus.mediaUrl}
              alt="Chart preview"
              className="max-h-48 rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => update({ mediaUrl: undefined })}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <MediaUploadZone onUploaded={(url) => update({ mediaUrl: url })} />
          </div>
        )}
      </div>

      {/* Sample Answer (optional) */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Bài mẫu (tuỳ chọn)
        </label>
        <textarea
          value={stimulus.questionGroups[0]?.instruction || ''}
          onChange={(e) => {
            const groups = stimulus.questionGroups.length > 0
              ? [{ ...stimulus.questionGroups[0], instruction: e.target.value }]
              : [{ questionTypeCode: 'SHORT_ANSWER' as const, instruction: e.target.value, questions: [] }];
            update({ questionGroups: groups });
          }}
          placeholder="Nhập bài mẫu tham khảo (nếu có)..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid}>Tiếp theo</Button>
      </div>
    </div>
  );
}
