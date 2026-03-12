'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTest } from '@/lib/admin-api';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { SKILL_SECTIONS } from '@/components/admin/test-import-step1-basic-info';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { TestDetailResponse } from '@/types/test.types';

const STATUSES = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'HIDDEN', label: 'Ẩn' },
];

const SKILLS = ['LISTENING', 'READING', 'SPEAKING', 'WRITING'];

const SKILL_MODES: Record<string, string[]> = {
  READING: ['PRACTICE', 'FULL_TEST'],
  LISTENING: ['PRACTICE', 'FULL_TEST'],
  WRITING: ['PRACTICE'],
  SPEAKING: ['PRACTICE', 'FULL_TEST'],
};

const MODE_LABELS: Record<string, string> = {
  PRACTICE: 'Bài lẻ',
  FULL_TEST: 'Full đề',
};

const TEST_TYPES = ['ACADEMIC', 'GENERAL_TRAINING', 'BOTH'];
const TEST_TYPE_LABELS: Record<string, string> = {
  ACADEMIC: 'Academic',
  GENERAL_TRAINING: 'General Training',
  BOTH: 'Cả hai',
};
const SKILLS_WITH_TEST_TYPE = ['READING', 'LISTENING'];

interface Props {
  test: TestDetailResponse;
}

export function TestEditBasicInfoTab({ test }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState(test.title);
  const [description, setDescription] = useState(test.description || '');
  const [status, setStatus] = useState(test.status || 'DRAFT');
  const [duration, setDuration] = useState(test.duration ? String(test.duration) : '');
  const [thumbnailUrl, setThumbnailUrl] = useState(test.thumbnailUrl || '');
  const [skill, setSkill] = useState(test.skill || '');
  const [testMode, setTestMode] = useState(test.testMode || '');
  const [section, setSection] = useState<number | null>(test.section ?? null);
  const [testType, setTestType] = useState(test.testType || '');

  const modes = skill ? (SKILL_MODES[skill] || []) : [];
  const sections = skill && testMode === 'PRACTICE' ? (SKILL_SECTIONS[skill] || []) : [];
  const needsSection = testMode === 'PRACTICE' && sections.length > 0;

  const handleSkillChange = (newSkill: string) => {
    setSkill(newSkill);
    const skillModes = SKILL_MODES[newSkill] || [];
    setTestMode(skillModes.length === 1 ? skillModes[0] : '');
    setSection(null);
    setTestType('');
  };

  const handleModeChange = (newMode: string) => {
    setTestMode(newMode);
    setSection(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    setSubmitting(true);
    try {
      await updateTest(String(test.id), {
        title,
        description: description || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        status,
        duration: duration ? Number(duration) : undefined,
        skill: skill || undefined,
        testMode: testMode || undefined,
        section: section ?? undefined,
        testType: testType || undefined,
      });
      toast.success('Cập nhật thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', String(test.id)] });
      router.push(`/admin/tests/${test.id}`);
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="title" className="mb-1.5 block text-sm font-medium">Tiêu đề *</Label>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề bài thi" />
        </div>
        <div>
          <Label htmlFor="description" className="mb-1.5 block text-sm font-medium">Mô tả</Label>
          <textarea
            id="description" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Mô tả bài thi" rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        {/* Skill */}
        <div>
          <Label htmlFor="skill" className="mb-1.5 block text-sm font-medium">Kỹ năng</Label>
          <select id="skill" value={skill} onChange={e => handleSkillChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Chọn kỹ năng</option>
            {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Test Mode */}
        {skill && modes.length > 0 && (
          <div>
            <Label className="mb-1.5 block text-sm font-medium">Loại bài</Label>
            <div className="flex gap-2">
              {modes.map(mode => (
                <button key={mode} type="button" onClick={() => handleModeChange(mode)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    testMode === mode ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}>
                  {MODE_LABELS[mode] || mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section */}
        {needsSection && (
          <div>
            <Label className="mb-1.5 block text-sm font-medium">Phần</Label>
            <select value={section ?? ''} onChange={e => setSection(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Chọn phần</option>
              {sections.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}

        {/* Dạng đề: chỉ hiện cho READING / LISTENING */}
        {SKILLS_WITH_TEST_TYPE.includes(skill) && (
          <div>
            <Label className="mb-1.5 block text-sm font-medium">Dạng đề</Label>
            <select value={testType} onChange={e => setTestType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Chọn dạng đề</option>
              {TEST_TYPES.map(t => <option key={t} value={t}>{TEST_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
        )}

        <div>
          <Label className="mb-1.5 block text-sm font-medium">Ảnh bìa</Label>
          {thumbnailUrl ? (
            <div className="relative w-fit">
              <img src={thumbnailUrl} alt="Thumbnail" className="h-32 rounded-lg object-cover border" />
              <button type="button" onClick={() => setThumbnailUrl('')}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <MediaUploadZone onUploaded={setThumbnailUrl} />
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status" className="mb-1.5 block text-sm font-medium">Trạng thái</Label>
            <select id="status" value={status} onChange={e => setStatus(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="duration" className="mb-1.5 block text-sm font-medium">Thời gian (phút)</Label>
            <Input id="duration" type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="VD: 60" min={0} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.push(`/admin/tests/${test.id}`)}>Hủy</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </div>
  );
}
