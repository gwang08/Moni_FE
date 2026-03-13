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

const SAMPLE_FIELDS = [
  { key: 'introduction', label: 'Introduction', placeholder: 'Nhập đoạn mở bài mẫu...', rows: 3 },
  { key: 'overview', label: 'Overview', placeholder: 'Nhập đoạn tổng quan mẫu...', rows: 3 },
  { key: 'body1', label: 'Body 1', placeholder: 'Nhập đoạn thân bài 1 mẫu...', rows: 4 },
  { key: 'body2', label: 'Body 2', placeholder: 'Nhập đoạn thân bài 2 mẫu...', rows: 4 },
];

const SEPARATOR = '\n---SECTION---\n';

function parseSampleAnswer(raw: string): Record<string, string> {
  const parts = raw.split(SEPARATOR);
  return {
    introduction: parts[0]?.trim() || '',
    overview: parts[1]?.trim() || '',
    body1: parts[2]?.trim() || '',
    body2: parts[3]?.trim() || '',
  };
}

function buildSampleAnswer(fields: Record<string, string>): string {
  return [
    fields.introduction || '',
    fields.overview || '',
    fields.body1 || '',
    fields.body2 || '',
  ].join(SEPARATOR);
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

  const rawSample = stimulus.questionGroups[0]?.instruction || '';
  const sampleFields = parseSampleAnswer(rawSample);

  const updateSampleField = (key: string, value: string) => {
    const updated = { ...sampleFields, [key]: value };
    const instruction = buildSampleAnswer(updated);
    const groups = stimulus.questionGroups.length > 0
      ? [{ ...stimulus.questionGroups[0], instruction }]
      : [{ questionTypeCode: 'SHORT_ANSWER' as const, instruction, questions: [] }];
    update({ questionGroups: groups });
  };

  return (
    <div className="space-y-5">
      {/* Đề bài - Rich Text Editor giống Reading */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Đề bài Writing
          <span className="text-xs text-gray-400 font-normal ml-2">Có thể chèn ảnh biểu đồ trực tiếp vào đề</span>
        </label>
        <StimulusCard
          stimulus={stimulus}
          index={0}
          onChange={(updated) => onChange([updated])}
        />
      </div>

      {/* Bài mẫu - 4 fields */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-3 block">
          Bài mẫu (tuỳ chọn)
        </label>
        <div className="space-y-3">
          {SAMPLE_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{field.label}</label>
              <textarea
                value={sampleFields[field.key] || ''}
                onChange={(e) => updateSampleField(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={field.rows}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid}>Tiếp theo</Button>
      </div>
    </div>
  );
}
