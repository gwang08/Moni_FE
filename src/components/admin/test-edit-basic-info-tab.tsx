'use client';

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTest, uploadMedia, getTags, updateStimulus } from '@/lib/admin-api';
import { SKILL_SECTIONS } from '@/components/admin/test-import-step1-basic-info';
import {
  WRITING_TASK1_TYPE_CODES,
  WRITING_TASK2_TYPE_CODES,
} from '@/components/practice/writing-filter-constants';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { TestDetailResponse } from '@/types/test.types';
import type { TagResponse } from '@/types/admin.types';

const TEST_TYPES = ['ACADEMIC', 'GENERAL_TRAINING'];
const TEST_TYPE_LABELS: Record<string, string> = {
  ACADEMIC: 'Academic',
  GENERAL_TRAINING: 'General Training',
};
const SKILLS_WITH_TEST_TYPE = ['READING', 'WRITING'];

import { toMinutes as toMin } from '@/lib/duration-utils';
const toMinutes = (duration?: number | null) => {
  const m = toMin(duration);
  return m > 0 ? String(m) : '';
};

const normalizeStatus = (value?: string | null) => ((value || '').toUpperCase() === 'HIDDEN' ? 'HIDDEN' : 'PUBLISHED');
const normalizeTestType = (value?: string | null) => {
  const raw = (value || '').trim().toUpperCase();
  if (!raw) return '';
  if (raw === 'ACADEMIC') return 'ACADEMIC';
  if (raw === 'GENERAL_TRAINING' || raw === 'GENERAL TRAINING' || raw === 'GENERAL-TRAINING') return 'GENERAL_TRAINING';
  if (raw.includes('GENERAL')) return 'GENERAL_TRAINING';
  if (raw.includes('ACADEMIC')) return 'ACADEMIC';
  return raw.replace(/\s+/g, '_');
};

interface Props {
  test: TestDetailResponse;
  onSaved?: () => void;
}

export interface TestEditBasicInfoHandle {
  save: (silent?: boolean) => Promise<boolean>;
}

export const TestEditBasicInfoTab = forwardRef<TestEditBasicInfoHandle, Props>(function TestEditBasicInfoTab(
  { test, onSaved }: Props,
  ref
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(test.title);
  const [status, setStatus] = useState(normalizeStatus(test.status));
  const [duration, setDuration] = useState(toMinutes(test.duration));
  const [thumbnailUrl, setThumbnailUrl] = useState(test.thumbnailUrl || '');
  const skill = test.skill || '';
  const [section, setSection] = useState<number | null>(test.section ?? null);
  const [testType, setTestType] = useState(SKILLS_WITH_TEST_TYPE.includes(skill) ? normalizeTestType(test.testType) : '');
  const thumbnailFileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Shared tags state
  const firstGroup = test.stimuli[0]?.questionGroups[0];
  const firstStimulus = test.stimuli[0];
  const [writingTypeTags, setWritingTypeTags] = useState<TagResponse[]>([]);
  const [topicTags, setTopicTags] = useState<TagResponse[]>([]);

  const [selectedWritingTypeId, setSelectedWritingTypeId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [testTagIds, setTestTagIds] = useState<number[]>(test.tagIds || []);

  const sections = skill ? (SKILL_SECTIONS[skill] || []) : [];
  const needsSection = sections.length > 0;
  const isWriting = skill === 'WRITING';
  const isSpeaking = skill === 'SPEAKING';
  const isTask1 = test.section === 1 || test.section === 3;
  const isTask2 = test.section === 2;

  // Derive valid writing type tags for the current task
  const taskTypeCodes = isTask1 ? WRITING_TASK1_TYPE_CODES : isTask2 ? WRITING_TASK2_TYPE_CODES : {};
  const validWritingTypeTags = writingTypeTags.filter((t) => 
    Object.keys(taskTypeCodes).some(label => label.toLowerCase() === t.name.toLowerCase())
  );

  // Load tags from API
  useEffect(() => {
    if (!isWriting && !isSpeaking) return;
    getTags().then(allTags => {
      const wt = allTags.filter(t => t.type === 'WRITING_TYPE' || t.type === 'QUESTION_TYPE');
      const tp = allTags.filter(t => t.type === 'TOPIC');
      setWritingTypeTags(wt);
      setTopicTags(tp);

      if (isWriting) {
        // Pre-populate from existing stimulus tagIds for writing
        const existingTagIds = firstStimulus?.tagIds ?? [];
        const existingWt = wt.find(t => existingTagIds.includes(t.id));
        const existingTp = tp.find(t => existingTagIds.includes(t.id));

        // If no tag is set but we have a questionTypeCode, try backward compatibility fallback
        if (!existingWt && firstGroup?.questionTypeCode) {
          const typeCodes = isTask1 ? WRITING_TASK1_TYPE_CODES : isTask2 ? WRITING_TASK2_TYPE_CODES : {};
          const label = Object.keys(typeCodes).find((l) => typeCodes[l] === firstGroup.questionTypeCode);
          const fallbackWt = wt.find(t => t.name.toLowerCase() === (label || '').toLowerCase());
          if (fallbackWt) setSelectedWritingTypeId(fallbackWt.id);
        } else if (existingWt) {
          setSelectedWritingTypeId(existingWt.id);
        }
        
        if (existingTp) setSelectedTopicId(existingTp.id);
      }
    }).catch(console.error);
  }, [isWriting, isSpeaking, isTask1, isTask2, firstStimulus, firstGroup]);

  const handleTagToggle = (tagId: number) => {
    const newTags = testTagIds.includes(tagId)
      ? testTagIds.filter(id => id !== tagId)
      : [...testTagIds, tagId];
    setTestTagIds(newTags);
  };

  const handleSave = async (silent = false) => {
    if (!title.trim()) {
      if (!silent) toast.error('Vui lòng nhập tiêu đề');
      return false;
    }
    if (skill !== 'LISTENING' && (!duration || Number(duration) <= 0)) {
      if (!silent) toast.error('Vui lòng nhập thời gian làm bài');
      return false;
    }

    try {
      let finalThumbnailUrl = thumbnailUrl || undefined;
      if (thumbnailFileRef.current) {
        finalThumbnailUrl = await uploadMedia(thumbnailFileRef.current);
        thumbnailFileRef.current = null;
      }

      await updateTest(String(test.id), {
        title,
        thumbnailUrl: finalThumbnailUrl,
        status: normalizeStatus(status),
        duration: duration ? Number(duration) : undefined,
        skill: skill || undefined,
        testMode: test.testMode || undefined,
        section: section ?? undefined,
        testType: SKILLS_WITH_TEST_TYPE.includes(skill) ? testType || undefined : undefined,
        tagIds: isSpeaking ? testTagIds : undefined,
      });

      // Writing: update question type code & tags
      if (isWriting && (isTask1 || isTask2)) {
        if (firstStimulus) {
          const newTagIds: number[] = [];
          if (selectedWritingTypeId) newTagIds.push(selectedWritingTypeId);
          if (selectedTopicId) newTagIds.push(selectedTopicId);
          await updateStimulus(firstStimulus.id, { tagIds: newTagIds });
        }

        if (firstGroup && selectedWritingTypeId) {
          const tag = writingTypeTags.find(t => t.id === selectedWritingTypeId);
          if (tag && taskTypeCodes[tag.name]) {
            const code = taskTypeCodes[tag.name] as string;
            if (code !== firstGroup.questionTypeCode) {
              await import('@/lib/admin-api').then(({ updateQuestionGroupTypeCode }) =>
                updateQuestionGroupTypeCode(firstGroup.id, code)
              );
            }
          }
        } else if (firstGroup && !selectedWritingTypeId && firstGroup.questionTypeCode) {
          // Clear it if tag is unselected
          await import('@/lib/admin-api').then(({ updateQuestionGroupTypeCode }) =>
            updateQuestionGroupTypeCode(firstGroup.id, '')
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ['admin', 'test', String(test.id)] });
      
      if (!silent) {
        toast.success('Cập nhật thành công!');
        if (onSaved) onSaved();
        else router.push(`/admin/tests/${test.id}`);
      }
      return true;
    } catch {
      if (!silent) toast.error('Cập nhật thất bại');
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <div className="flex gap-6 items-stretch">
          {/* Left column: Title + Thumbnail */}
          <div className="flex-1 space-y-4 flex flex-col">
            <div>
              <Label htmlFor="title" className="mb-1.5 block text-sm font-medium">Tiêu đề bài thi *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Cambridge 18 - Test 1"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <Label className="mb-1.5 block text-sm font-medium">Ảnh bìa</Label>
              {thumbnailUrl ? (
                <div className="relative flex-1 min-h-[160px] w-full overflow-hidden rounded-lg border">
                  <Image src={thumbnailUrl} alt="Thumbnail" width={960} height={280} className="h-full w-full object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailUrl('');
                      thumbnailFileRef.current = null;
                    }}
                    className="absolute right-3 top-3 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 min-h-[160px]">
                  <div
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const previewUrl = URL.createObjectURL(file);
                          setThumbnailUrl(previewUrl);
                          thumbnailFileRef.current = file;
                        }
                      }}
                    />
                    <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-600">Thêm ảnh</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Settings - framed panel */}
          <div className="w-80 shrink-0 self-stretch">
            <div className="rounded-lg border border-gray-200 bg-white p-5 h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700 whitespace-nowrap">Hiển thị</Label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={status === 'PUBLISHED'}
                      onChange={(e) => setStatus(e.target.checked ? 'PUBLISHED' : 'HIDDEN')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Kỹ năng</span>
                  <div className="rounded-md border border-input bg-white px-3 text-sm font-medium text-gray-800 text-center">
                    {skill || '-'}
                  </div>
                </div>

                {needsSection && (
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Phần</Label>
                    <select
                      value={section ?? ''}
                      onChange={(e) => setSection(e.target.value ? Number(e.target.value) : null)}
                      className="rounded-md border border-input bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[140px]"
                    >
                      <option value="">Chọn phần</option>
                      {sections.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {SKILLS_WITH_TEST_TYPE.includes(skill) && (
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Dạng đề</Label>
                    <select
                      value={testType}
                      onChange={(e) => setTestType(e.target.value)}
                      className="rounded-md border border-input bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[140px]"
                    >
                      <option value="">Chọn dạng đề</option>
                      {TEST_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {TEST_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!isWriting && skill !== 'LISTENING' && !isSpeaking && (
                  <div className="flex items-center gap-4">
                    <Label htmlFor="duration" className="text-sm font-medium text-gray-700 whitespace-nowrap">Thời gian</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="duration"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="60"
                        min={1}
                        required
                        className="w-16 text-center h-7 text-sm"
                      />
                      <span className="text-sm text-gray-600 whitespace-nowrap">phút</span>
                    </div>
                  </div>
                )}

                {isSpeaking && topicTags.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-gray-700">Chủ đề (Topic) *</Label>
                    <div className="flex flex-wrap gap-2">
                      {topicTags.map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleTagToggle(Number(tag.id))}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            testTagIds.includes(Number(tag.id))
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isWriting && (
                  <>
                    {/* Writing Task 1 & 2: dynamic tags from DB */}
                    {(isTask1 || isTask2) && (
                      <>
                        <div className="flex items-center gap-4">
                          <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Dạng đề</Label>
                          <select
                            value={selectedWritingTypeId ?? ''}
                            onChange={(e) => setSelectedWritingTypeId(e.target.value ? Number(e.target.value) : null)}
                            className="rounded-md border border-input bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[180px] truncate"
                          >
                            <option value="">Chọn dạng đề</option>
                            {validWritingTypeTags.map((tag) => (
                              <option key={tag.id} value={tag.id}>
                                {tag.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {isTask2 && (
                          <div className="flex items-center gap-4">
                            <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Chủ đề</Label>
                            <select
                              value={selectedTopicId ?? ''}
                              onChange={(e) => setSelectedTopicId(e.target.value ? Number(e.target.value) : null)}
                              className="rounded-md border border-input bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[180px] truncate"
                            >
                              <option value="">Chọn chủ đề</option>
                              {topicTags.map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                  {tag.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex items-center gap-4">
                      <Label htmlFor="duration" className="text-sm font-medium text-gray-700 whitespace-nowrap">Thời gian</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="duration"
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="40"
                          min={1}
                          required
                          className="w-16 text-center h-7 text-sm"
                        />
                        <span className="text-sm text-gray-600 whitespace-nowrap">phút</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
});

