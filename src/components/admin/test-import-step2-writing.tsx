'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StimulusCard } from '@/components/admin/test-import-stimulus-card';
import {
  WRITING_TASK1_TYPES,
  WRITING_TASK1_TYPE_CODES,
  WRITING_TASK2_TYPES,
  WRITING_TASK2_TYPE_CODES,
  WRITING_TOPICS,
} from '@/components/practice/writing-filter-constants';
import type { StimulusRequest, QuestionTypeCode, QuestionGroupRequest } from '@/types/admin.types';

interface Props {
  stimuli: StimulusRequest[];
  onChange: (stimuli: StimulusRequest[]) => void;
  onNext: () => void;
  onBack: () => void;
  /** Section number: 1 = Task 1, 2 = Task 2 */
  section?: number | null;
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

export function TestImportStep2Writing({ stimuli, onChange, onNext, onBack, section }: Props) {
  useEffect(() => {
    if (stimuli.length === 0) onChange([emptyStimulus()]);
  }, [stimuli.length, onChange]);

  if (stimuli.length === 0) return null;

  const stimulus = stimuli[0];
  const update = (patch: Partial<StimulusRequest>) => onChange([{ ...stimulus, ...patch }]);
  const isValid = stimulus.content.trim().length > 0;

  const rawSample = stimulus.questionGroups[0]?.instruction || '';
  const sampleFields = parseSampleAnswer(rawSample);

  // Determine writing type options based on section
  const isTask1 = section === 1;
  const isTask2 = section === 2;
  const typeOptions = isTask1 ? WRITING_TASK1_TYPES : isTask2 ? WRITING_TASK2_TYPES : [];
  const typeCodes = isTask1 ? WRITING_TASK1_TYPE_CODES : isTask2 ? WRITING_TASK2_TYPE_CODES : {};

  // Current questionTypeCode stored in first group
  const currentTypeCode = stimulus.questionGroups[0]?.questionTypeCode || '';
  // Current topic stored in groupContent of first group
  const currentTopic = stimulus.questionGroups[0]?.groupContent || '';

  /** Helper: update fields on the first questionGroup, creating it if needed */
  const updateGroup = (patch: Partial<QuestionGroupRequest>) => {
    const existing: QuestionGroupRequest = stimulus.questionGroups[0] || { questionTypeCode: 'SHORT_ANSWER', instruction: '', questions: [] };
    const groups = [{ ...existing, ...patch }];
    update({ questionGroups: groups });
  };

  const updateWritingType = (label: string) => {
    const code = (typeCodes[label] || '') as QuestionTypeCode;
    updateGroup({ questionTypeCode: code });
  };

  const updateTopic = (topicValue: string) => {
    updateGroup({ groupContent: topicValue });
  };

  const updateSampleField = (key: string, value: string) => {
    const updated = { ...sampleFields, [key]: value };
    const instruction = buildSampleAnswer(updated);
    updateGroup({ instruction });
  };

  // Reverse lookup: code → label for display in select
  const codeToLabel: Record<string, string> = Object.fromEntries(
    Object.entries(typeCodes).map(([label, code]) => [code, label])
  );
  const selectedTypeLabel = codeToLabel[currentTypeCode] || '';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {/* Dạng đề — chỉ hiển thị khi là Task 1 hoặc Task 2 */}
      {(isTask1 || isTask2) && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Dạng đề
            <span className="text-xs text-gray-400 font-normal ml-2">
              {isTask1 ? 'Task 1' : 'Task 2'}
            </span>
          </label>
          <select
            value={selectedTypeLabel}
            onChange={(e) => updateWritingType(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn dạng đề --</option>
            {typeOptions.map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Chủ đề — chỉ hiển thị khi là Task 2 */}
      {isTask2 && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Chủ đề</label>
          <select
            value={currentTopic}
            onChange={(e) => updateTopic(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn chủ đề --</option>
            {WRITING_TOPICS.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>
      )}

      {/* Đề bài - Rich Text Editor giống Reading */}
      <div className="flex min-h-0 flex-1 flex-col">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Đề bài Writing
          <span className="text-xs text-gray-400 font-normal ml-2">Có thể chèn ảnh biểu đồ trực tiếp vào đề</span>
        </label>
        <div className="flex min-h-0 flex-1">
          <StimulusCard
            stimulus={stimulus}
            onChange={(updated) => onChange([updated])}
          />
        </div>
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
