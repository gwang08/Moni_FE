'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { createTag, updateTag } from '@/lib/admin-api';
import { TagType, type TagResponse, type TagRequest } from '@/types/admin.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: TagResponse;
  onSuccess: () => void;
}

const TAG_TYPES = Object.values(TagType);

const defaultForm: TagRequest = { name: '', type: TagType.TOPIC, description: '' };

export function TagFormDialog({ open, onOpenChange, tag, onSuccess }: Props) {
  const [form, setForm] = useState<TagRequest>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(tag ? { name: tag.name, type: tag.type, description: tag.description || '' } : defaultForm);
      setError('');
    }
  }, [open, tag]);

  const set = (key: keyof TagRequest, value: string) =>
    setForm(prev => ({ ...prev, [key]: key === 'type' ? (value as TagType) : value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Vui lòng nhập tên tag'); return; }
    setSubmitting(true);
    setError('');
    try {
      if (tag) {
        await updateTag(tag.id, form);
      } else {
        await createTag(form);
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      setError(tag ? 'Cập nhật tag thất bại' : 'Tạo tag thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tag ? 'Chỉnh sửa tag' : 'Tạo tag mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tag-name" className="mb-1.5 block text-sm font-medium">Tên tag *</Label>
            <Input id="tag-name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nhập tên tag" />
          </div>

          <div>
            <Label htmlFor="tag-type" className="mb-1.5 block text-sm font-medium">Loại tag *</Label>
            <select
              id="tag-type"
              value={form.type}
              onChange={e => set('type', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {TAG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <Label htmlFor="tag-description" className="mb-1.5 block text-sm font-medium">Mô tả</Label>
            <textarea
              id="tag-description"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Mô tả (tùy chọn)"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : tag ? 'Lưu' : 'Tạo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
