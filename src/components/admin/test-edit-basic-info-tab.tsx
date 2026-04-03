'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTest, uploadMedia } from '@/lib/admin-api';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { SKILL_SECTIONS } from '@/components/admin/test-import-step1-basic-info';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { TestDetailResponse } from '@/types/test.types';

const STATUSES = [
  { value: 'PUBLISHED', label: 'Sẵn sàng' },
  { value: 'HIDDEN', label: 'Ẩn' },
];

const TEST_TYPES = ['ACADEMIC', 'GENERAL_TRAINING'];
const TEST_TYPE_LABELS: Record<string, string> = {
  ACADEMIC: 'Academic',
  GENERAL_TRAINING: 'General Training',
};
const SKILLS_WITH_TEST_TYPE = ['READING', 'LISTENING'];

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

export function TestEditBasicInfoTab({ test, onSaved }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState(test.title);
  const [status, setStatus] = useState(normalizeStatus(test.status));
  const [duration, setDuration] = useState(toMinutes(test.duration));
  const [thumbnailUrl, setThumbnailUrl] = useState(test.thumbnailUrl || '');
  const skill = test.skill || '';
  const [section, setSection] = useState<number | null>(test.section ?? null);
  const [testType, setTestType] = useState(normalizeTestType(test.testType));
  const thumbnailFileRef = useRef<File | null>(null);

  const sections = skill ? (SKILL_SECTIONS[skill] || []) : [];
  const needsSection = sections.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    if (!duration || Number(duration) <= 0) {
      toast.error('Vui lòng nhập thời gian làm bài');
      return;
    }

    setSubmitting(true);
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
        duration: duration ? Number(duration) * 60 : undefined,
        skill: skill || undefined,
        testMode: test.testMode || undefined,
        section: section ?? undefined,
        testType: testType || undefined,
      });
      toast.success('Cập nhật thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', String(test.id)] });
      if (onSaved) onSaved();
      else router.push(`/admin/tests/${test.id}`);
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(`/admin/tests/${test.id}`)}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div>
              <Label htmlFor="title" className="mb-1.5 block text-sm font-medium">Tiêu đề *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề bài thi" />
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-medium">Ảnh bìa</Label>
              {thumbnailUrl ? (
                <div className="relative w-full overflow-hidden rounded-lg border">
                  <Image src={thumbnailUrl} alt="Thumbnail" width={960} height={260} className="h-48 w-full object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailUrl('');
                      thumbnailFileRef.current = null;
                    }}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <MediaUploadZone
                  onUploaded={setThumbnailUrl}
                  onFileSelected={(file, previewUrl) => {
                    setThumbnailUrl(previewUrl);
                    thumbnailFileRef.current = file;
                  }}
                />
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="mb-1.5 block text-sm font-medium">Kỹ năng</Label>
                <div className="rounded-md border border-input bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800">
                  {skill || '-'}
                </div>
              </div>

              {needsSection && (
                <div className="col-span-2">
                  <Label className="mb-1.5 block text-sm font-medium">Phần</Label>
                  <select
                    value={section ?? ''}
                    onChange={(e) => setSection(e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                <div className="col-span-2">
                  <Label className="mb-1.5 block text-sm font-medium">Dạng đề</Label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

              <div>
                <Label htmlFor="status" className="mb-1.5 block text-sm font-medium">Trạng thái</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                  {status && !STATUSES.some((s) => s.value === status) && <option value={status}>{status}</option>}
                </select>
              </div>

              <div>
                <Label htmlFor="duration" className="mb-1.5 block text-sm font-medium">Thời gian làm bài (phút) *</Label>
                <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="VD: 60" min={1} required />
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
