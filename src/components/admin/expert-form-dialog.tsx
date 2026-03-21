'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createExpert } from '@/lib/admin-expert-api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { ExpertProfile, CreateExpertRequest } from '@/types/expert.types';

interface ExpertFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (expert: ExpertProfile) => void;
}

const SPECS = ['WRITING', 'SPEAKING', 'BOTH'] as const;

const DEFAULT: CreateExpertRequest = {
  email: '',
  password: '',
  displayName: '',
  avatarUrl: '',
  bandScore: 7,
  yearsExperience: 1,
  specialization: 'BOTH',
  bio: '',
};

export function ExpertFormDialog({ open, onClose, onCreated }: ExpertFormDialogProps) {
  const [form, setForm] = useState<CreateExpertRequest>(DEFAULT);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof CreateExpertRequest, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.displayName) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setLoading(true);
    try {
      const expert = await createExpert(form);
      onCreated(expert);
      setForm(DEFAULT);
      onClose();
      toast.success('Tạo Expert thành công!');
    } catch {
      toast.error('Tạo Expert thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Expert mới</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <Label className="text-xs">Email *</Label>
            <Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="expert@example.com" />
          </div>
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <Label className="text-xs">Mật khẩu *</Label>
            <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Tên hiển thị *</Label>
            <Input value={form.displayName} onChange={(e) => set('displayName', e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Avatar URL</Label>
            <Input value={form.avatarUrl ?? ''} onChange={(e) => set('avatarUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Band Score</Label>
            <Input type="number" min={4} max={9} step={0.5} value={form.bandScore} onChange={(e) => set('bandScore', parseFloat(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Số năm kinh nghiệm</Label>
            <Input type="number" min={0} value={form.yearsExperience} onChange={(e) => set('yearsExperience', parseInt(e.target.value))} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Chuyên môn</Label>
            <select
              className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.specialization}
              onChange={(e) => set('specialization', e.target.value)}
            >
              {SPECS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Giới thiệu</Label>
            <textarea
              className="w-full rounded-md border bg-white px-3 py-2 text-sm min-h-[70px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="Giới thiệu ngắn về giảng viên..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Huỷ</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang tạo...</> : 'Tạo Expert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
