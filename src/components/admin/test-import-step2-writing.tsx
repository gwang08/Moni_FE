'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StimulusCard } from '@/components/admin/test-import-stimulus-card';
import {
  WRITING_TASK1_TYPE_CODES,
  WRITING_TASK2_TYPE_CODES,
} from '@/components/practice/writing-filter-constants';
import { getTags } from '@/lib/admin-api';
import type { TagResponse, StimulusRequest, QuestionTypeCode, QuestionGroupRequest } from '@/types/admin.types';

interface Props {
  stimuli: StimulusRequest[];
  onChange: (stimuli: StimulusRequest[]) => void;
  onNext: () => void;
  onBack: () => void;
  /** Section number: 1 = Task 1, 2 = Task 2 */
  section?: number | null;
}

const emptyStimulus = (): StimulusRequest => ({
  title: '',
  content: '',
  mediaUrl: undefined,
  section: 1,
  questionGroups: [],
  tagIds: [],
});

export function TestImportStep2Writing({ stimuli, onChange, onNext, onBack, section }: Props) {
  const [writingTypeTags, setWritingTypeTags] = useState<TagResponse[]>([]);
  const [topicTags, setTopicTags] = useState<TagResponse[]>([]);

  // Fetch tags by type from API once on mount
  useEffect(() => {
    getTags().then((all) => {
      // Corrected filter to include both WRITING_TYPE and QUESTION_TYPE as per DB structure
      setWritingTypeTags(all.filter((t) => t.type === 'WRITING_TYPE' || t.type === 'QUESTION_TYPE'));
      setTopicTags(all.filter((t) => t.type === 'TOPIC'));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (stimuli.length === 0) onChange([emptyStimulus()]);
  }, [stimuli.length, onChange]);

  if (stimuli.length === 0) return null;

  const stimulus = stimuli[0];
  const update = (patch: Partial<StimulusRequest>) => onChange([{ ...stimulus, ...patch }]);
  
  // Determine writing type options based on section
  const isTask1 = section === 1 || section === 3;
  const isTask2 = section === 2;
  const typeCodes = isTask1 ? WRITING_TASK1_TYPE_CODES : isTask2 ? WRITING_TASK2_TYPE_CODES : {};

  const currentTagIds = stimulus.tagIds || [];
  const currentTypeCode = stimulus.questionGroups[0]?.questionTypeCode || '';

  // Derive currently selected writing type tag ID from questionTypeCode
  const validWritingTypeTags = writingTypeTags.filter((t) => 
    Object.keys(typeCodes).some(label => {
      const normalizedLabel = label.replace('Task 1: ', '').replace('Task 2: ', '').toLowerCase();
      const normalizedTagName = t.name.toLowerCase();
      return normalizedTagName === normalizedLabel || 
             (normalizedLabel === 'mixed chart' && (normalizedTagName.includes('multi chart') || normalizedTagName.includes('mixed'))) ||
             (normalizedTagName === 'mixed graph' && normalizedLabel === 'mixed chart');
    })
  );

  const selectedWritingTypeTag = validWritingTypeTags.find((t) => {
    // Match by looking up label from code
    const label = Object.keys(typeCodes).find((l) => typeCodes[l] === currentTypeCode);
    if (!label) return false;
    
    const normalizedLabel = label.replace('Task 1: ', '').replace('Task 2: ', '').toLowerCase();
    const normalizedTagName = t.name.toLowerCase();
    return normalizedTagName === normalizedLabel || 
           (normalizedLabel === 'mixed chart' && (normalizedTagName.includes('multi chart') || normalizedTagName.includes('mixed'))) ||
           (normalizedTagName === 'mixed graph' && normalizedLabel === 'mixed chart');
  });

  const isValid = stimulus.content.trim().length > 0 && (selectedWritingTypeTag !== undefined);

  // Derive currently selected topic tag (first topic in tagIds)
  const selectedTopicTag = topicTags.find((t) => currentTagIds.includes(t.id));

  /** Helper: update fields on the first questionGroup, creating it if needed */
  const updateGroup = (patch: Partial<QuestionGroupRequest>) => {
    const existing: QuestionGroupRequest = stimulus.questionGroups[0] || { questionTypeCode: 'SHORT_ANSWER', instruction: '', questions: [] };
    update({ questionGroups: [{ ...existing, ...patch }] });
  };

  const updateWritingType = (tagId: number) => {
    const tag = validWritingTypeTags.find((t) => t.id === tagId);
    
    // Replace old writing type tag, keep others
    const writingTypeIds = validWritingTypeTags.map((t) => t.id);
    const otherTags = currentTagIds.filter((id) => !writingTypeIds.includes(id));
    const existing = stimulus.questionGroups[0] || { questionTypeCode: 'SHORT_ANSWER', instruction: '', questions: [] };

    if (!tag) {
      // Cleared
      onChange([{
        ...stimulus,
        questionGroups: [{ ...existing, questionTypeCode: '' as QuestionTypeCode }],
        tagIds: otherTags
      }]);
      return;
    }

    // Find the matching code from typeCodes using the same logic as filtering
    const matchingLabel = Object.keys(typeCodes).find(label => {
      const normalizedLabel = label.replace('Task 1: ', '').replace('Task 2: ', '').toLowerCase();
      const normalizedTagName = tag.name.toLowerCase();
      
      // Strict matching to avoid "Map Labeling" matching "Map"
      return normalizedTagName === normalizedLabel || 
             (normalizedLabel === 'mixed chart' && (normalizedTagName.includes('multi chart') || normalizedTagName.includes('mixed'))) ||
             (normalizedTagName === 'mixed graph' && normalizedLabel === 'mixed chart');
    });

    const code = (matchingLabel ? typeCodes[matchingLabel] : Object.values(typeCodes)[0] || '') as QuestionTypeCode;

    onChange([{
      ...stimulus,
      questionGroups: [{ ...existing, questionTypeCode: code }],
      tagIds: [...otherTags, tag.id]
    }]);
  };

  const updateTopic = (tagId: number) => {
    // Replace old topic tag, keep others (e.g. writing type tag)
    const topicIds = topicTags.map((t) => t.id);
    const otherTags = currentTagIds.filter((id) => !topicIds.includes(id));

    if (!tagId) {
      update({ tagIds: otherTags });
      return;
    }
    update({ tagIds: [...otherTags, tagId] });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Settings Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dạng đề */}
        {(isTask1 || isTask2) && (
          <div className={isTask1 && !isTask2 ? "md:col-span-2" : ""}>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Dạng đề
              <span className="text-xs text-gray-400 font-normal ml-2">Task {section}</span>
            </label>
            <select
              value={selectedWritingTypeTag?.id ?? ''}
              onChange={(e) => updateWritingType(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn dạng đề --</option>
              {validWritingTypeTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Chủ đề */}
        {isTask2 && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Chủ đề</label>
            <select
              value={selectedTopicTag?.id ?? ''}
              onChange={(e) => updateTopic(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn chủ đề --</option>
              {topicTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Đề bài - Higher height */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-2 block font-black uppercase tracking-tight">
          1. Đề bài Writing
          <span className="text-xs text-gray-400 font-normal ml-2 normal-case">Có thể chèn ảnh biểu đồ trực tiếp vào đề</span>
        </label>
        <div className="h-[400px]">
          <StimulusCard
            stimulus={stimulus}
            onChange={(updated) => onChange([updated])}
          />
        </div>
      </div>

      {/* Bài mẫu - Single Rich Text Editor */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-2 block font-black uppercase tracking-tight">
          2. Bài mẫu (Sample Answer)
          <span className="text-xs text-gray-400 font-normal ml-2 normal-case">Nhập toàn bộ bài mẫu, hệ thống sẽ tự tách đoạn cho người học</span>
        </label>
        <div className="h-[400px]">
          <StimulusCard
            stimulus={{
              ...emptyStimulus(),
              content: stimulus.questionGroups[0]?.instruction || '',
            }}
            onChange={(updated) => updateGroup({ instruction: updated.content })}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid} size="lg" className="px-10">Tiếp theo</Button>
      </div>
    </div>
  );
}
