'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTest, uploadMedia } from '@/lib/admin-api';
import { SKILL_SECTIONS } from '@/components/admin/test-import-step1-basic-info';
import {
  WRITING_TASK1_TYPES,
  WRITING_TASK1_TYPE_CODES,
  WRITING_TASK2_TYPES,
  WRITING_TASK2_TYPE_CODES,
  WRITING_TOPICS,
} from '@/components/practice/writing-filter-constants';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { TestDetailResponse } from '@/types/test.types';

const TEST_TYPES = ['ACADEMIC', 'GENERAL_TRAINING'];
const TEST_TYPE_LABELS: Record<string, string> = {
  ACADEMIC: 'Academic',
  GENERAL_TRAINING: 'General Training',
};
const SKILLS_WITH_TEST_TYPE = ['READING'];

const toMinutes = (duration?: number | null) => {
  if (!duration || duration <= 0) return '';
  return String(duration >= 300 ? Math.round(duration / 60) : duration);
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
  save: () => Promise<boolean>;
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

  // Writing-specific state
  const firstGroup = test.stimuli[0]?.questionGroups[0];
  const [writingType, setWritingType] = useState(firstGroup?.questionTypeCode || '');
  const [writingTopic, setWritingTopic] = useState(firstGroup?.groupContent || '');

  const sections = skill ? (SKILL_SECTIONS[skill] || []) : [];
  const needsSection = sections.length > 0;
  const isWriting = skill === 'WRITING';
  const isTask1 = test.section === 1;
  const isTask2 = test.section === 2;
  const writingTypeOptions = isTask1 ? WRITING_TASK1_TYPES : isTask2 ? WRITING_TASK2_TYPES : [];
  const writingTypeCodes = isTask1 ? WRITING_TASK1_TYPE_CODES : isTask2 ? WRITING_TASK2_TYPE_CODES : {};

  // Reverse lookup: code → label
  const writingCodeToLabel = isWriting ? Object.fromEntries(
    Object.entries(writingTypeCodes).map(([label, code]) => [code, label])
  ) : {};
  const selectedWritingTypeLabel = writingCodeToLabel[writingType] || '';

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return false;
    }
    if (skill !== 'LISTENING' && (!duration || Number(duration) <= 0)) {
      toast.error('Vui lòng nhập thời gian làm bài');
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
      });

      // Save writing type and topic if applicable
      if (isWriting && firstGroup && (writingType || writingTopic)) {
        const updates: Promise<unknown>[] = [];
        if (writingType && writingType !== firstGroup.questionTypeCode) {
          updates.push(import('@/lib/admin-api').then(({ updateQuestionGroupTypeCode }) => 
            updateQuestionGroupTypeCode(firstGroup.id, writingType)
          ));
        }
        if (writingTopic && writingTopic !== firstGroup.groupContent) {
          updates.push(import('@/lib/admin-api').then(({ updateQuestionGroupContent }) => 
            updateQuestionGroupContent(firstGroup.id, writingTopic)
          ));
        }
        if (updates.length > 0) {
          await Promise.all(updates);
        }
      }

      toast.success('Cập nhật thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', String(test.id)] });
      if (onSaved) onSaved();
      else router.push(`/admin/tests/${test.id}`);
      return true;
    } catch {
      toast.error('Cập nhật thất bại');
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

                {!isWriting && skill !== 'LISTENING' && (
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

                {isWriting && (
                  <>
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Dạng đề</Label>
                      <select
                        value={selectedWritingTypeLabel}
                        onChange={(e) => {
                          const label = e.target.value;
                          const code = (writingTypeCodes[label] as string) || '';
                          setWritingType(code);
                        }}
                        className="rounded-md border border-input bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[180px] truncate"
                      >
                        <option value="">Chọn dạng đề</option>
                        {writingTypeOptions.map((label) => (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isTask2 && (
                      <div className="flex items-center gap-4">
                        <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Chủ đề</Label>
                        <select
                          value={writingTopic}
                          onChange={(e) => setWritingTopic(e.target.value)}
                          className="rounded-md border border-input bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[180px] truncate"
                        >
                          <option value="">Chọn chủ đề</option>
                          {WRITING_TOPICS.map((topic) => (
                            <option key={topic} value={topic}>
                              {topic}
                            </option>
                          ))}
                        </select>
                      </div>
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
