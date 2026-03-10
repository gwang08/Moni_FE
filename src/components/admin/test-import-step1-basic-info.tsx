'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface BasicInfo {
  title: string;
  description: string;
  skill: string;
  testType: string;
}

interface Props {
  data: BasicInfo;
  onChange: (data: BasicInfo) => void;
  onNext: () => void;
}

const SKILLS = ['LISTENING', 'READING', 'SPEAKING', 'WRITING'];
const TEST_TYPES = [
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'GENERAL_TRAINING', label: 'General Training' },
];

export function TestImportStep1({ data, onChange, onNext }: Props) {
  const isValid = data.title.trim() && data.description.trim() && data.skill && data.testType;

  const set = (key: keyof BasicInfo, value: string) => onChange({ ...data, [key]: value });

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="title" className="mb-1.5 block text-sm font-medium">Tiêu đề bài thi *</Label>
        <Input id="title" value={data.title} onChange={e => set('title', e.target.value)}
          placeholder="VD: Cambridge 18 - Test 1" />
      </div>

      <div>
        <Label htmlFor="description" className="mb-1.5 block text-sm font-medium">Mô tả *</Label>
        <textarea
          id="description"
          value={data.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Nhập mô tả bài thi"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div>
        <Label htmlFor="skill" className="mb-1.5 block text-sm font-medium">Kỹ năng *</Label>
        <select
          id="skill"
          value={data.skill}
          onChange={e => set('skill', e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Chọn kỹ năng</option>
          {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <Label htmlFor="testType" className="mb-1.5 block text-sm font-medium">Loại bài thi *</Label>
        <select
          id="testType"
          value={data.testType}
          onChange={e => set('testType', e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Chọn loại bài thi</option>
          {TEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!isValid}>Tiếp theo</Button>
      </div>
    </div>
  );
}
