'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { X } from 'lucide-react';

export interface BasicInfo {
  title: string;
  skill: string;
  thumbnailUrl: string;
  section: number | null;
}

interface Props {
  data: BasicInfo;
  onChange: (data: BasicInfo) => void;
  onNext: () => void;
  onThumbnailFileSelected?: (file: File | null) => void;
}

const SKILLS = ['LISTENING', 'READING', 'SPEAKING', 'WRITING'];

export const SKILL_SECTIONS: Record<string, { value: number; label: string }[]> = {
  READING: [
    { value: 1, label: 'Passage 1' },
    { value: 2, label: 'Passage 2' },
    { value: 3, label: 'Passage 3' },
  ],
  LISTENING: [
    { value: 1, label: 'Section 1' },
    { value: 2, label: 'Section 2' },
    { value: 3, label: 'Section 3' },
    { value: 4, label: 'Section 4' },
  ],
  WRITING: [
    { value: 1, label: 'Task 1' },
    { value: 2, label: 'Task 2' },
    { value: 3, label: 'Task 1 Builder' },
  ],
  SPEAKING: [
    { value: 1, label: 'Part 1' },
    { value: 2, label: 'Part 2' },
    { value: 3, label: 'Part 3' },
  ],
};

export function TestImportStep1({ data, onChange, onNext, onThumbnailFileSelected }: Props) {
  const sections = data.skill ? (SKILL_SECTIONS[data.skill] || []) : [];
  const needsSection = sections.length > 0;

  const isValid = data.title.trim() && data.skill
    && (!needsSection || data.section !== null);

  const handleSkillChange = (skill: string) => {
    onChange({ ...data, skill, section: null });
  };

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="title" className="mb-1.5 block text-sm font-medium">Tiêu đề bài thi *</Label>
        <Input id="title" value={data.title} onChange={e => onChange({ ...data, title: e.target.value })}
          placeholder="VD: Cambridge 18 - Test 1" />
      </div>

      <div>
        <Label htmlFor="skill" className="mb-1.5 block text-sm font-medium">Kỹ năng *</Label>
        <select
          id="skill"
          value={data.skill}
          onChange={e => handleSkillChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Chọn kỹ năng</option>
          {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Section selection cho Bài lẻ */}
      {needsSection && (
        <div>
          <Label className="mb-1.5 block text-sm font-medium">Phần *</Label>
          <select
            value={data.section ?? ''}
            onChange={e => onChange({ ...data, section: e.target.value ? Number(e.target.value) : null })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Chọn phần</option>
            {sections.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      <div>
        <Label className="mb-1.5 block text-sm font-medium">Ảnh bìa</Label>
        {data.thumbnailUrl ? (
          <div className="relative w-fit">
            <img src={data.thumbnailUrl} alt="Thumbnail" className="h-32 rounded-lg object-cover border" />
            <button type="button" onClick={() => { onChange({ ...data, thumbnailUrl: '' }); onThumbnailFileSelected?.(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <MediaUploadZone
            onUploaded={(url) => onChange({ ...data, thumbnailUrl: url })}
            onFileSelected={(file, previewUrl) => {
              onChange({ ...data, thumbnailUrl: previewUrl });
              onThumbnailFileSelected?.(file);
            }}
          />
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!isValid}>Tiếp theo</Button>
      </div>
    </div>
  );
}
