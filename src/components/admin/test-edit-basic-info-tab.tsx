'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTest } from '@/lib/admin-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { TestDetailResponse } from '@/types/test.types';

const STATUSES = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'HIDDEN', label: 'Ẩn' },
];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    setSubmitting(true);
    try {
      await updateTest(String(test.id), {
        title,
        description: description || undefined,
        status,
        duration: duration ? Number(duration) : undefined,
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
