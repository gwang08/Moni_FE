'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createExpert } from '@/lib/admin-expert-api';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import type { ExpertProfile, CreateExpertRequest } from '@/types/expert.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (expert: ExpertProfile) => void;
}

const SPECS = [
  { value: 'WRITING', label: 'Writing' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'BOTH', label: 'Cả hai' },
] as const;

const DEFAULT: CreateExpertRequest = {
  email: '', displayName: '', avatarUrl: '',
  bandScore: 7, bandReading: 6, bandListening: 6, bandWriting: 7, bandSpeaking: 7,
  yearsExperience: 1, specialization: 'BOTH', bio: '',
};

export function ExpertFormDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateExpertRequest>(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');

  const set = (key: keyof CreateExpertRequest, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await apiClient.upload<{ result: string }>('/api/v1/admin/media/upload', file);
      const url = res.result;
      setForm((p) => ({ ...p, avatarUrl: url }));
      setAvatarPreview(URL.createObjectURL(file));
      toast.success('Upload ảnh thành công');
    } catch {
      toast.error('Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.email || !form.displayName) {
      toast.error('Vui lòng điền email và tên hiển thị');
      return;
    }
    setLoading(true);
    try {
      const expert = await createExpert(form);
      onCreated(expert);
      setForm(DEFAULT);
      setAvatarPreview('');
      onClose();
      toast.success('Tạo giảng viên thành công!');
    } catch {
      toast.error('Tạo giảng viên thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo giảng viên mới</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          {/* Avatar upload */}
          <div className="col-span-2 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0">
              {avatarPreview || form.avatarUrl ? (
                <img src={avatarPreview || form.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <Label className="text-xs">Ảnh đại diện</Label>
              <Input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="mt-1" />
              {uploading && <p className="text-xs text-blue-500 mt-1">Đang upload...</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Email *</Label>
            <Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="expert@example.com" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tên hiển thị *</Label>
            <Input value={form.displayName} onChange={(e) => set('displayName', e.target.value)} placeholder="Nguyễn Văn A" />
          </div>

          {/* Band scores */}
          <div className="col-span-2">
            <Label className="text-xs font-medium mb-2 block">Điểm IELTS</Label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { key: 'bandReading', label: 'Reading' },
                { key: 'bandListening', label: 'Listening' },
                { key: 'bandWriting', label: 'Writing' },
                { key: 'bandSpeaking', label: 'Speaking' },
                { key: 'bandScore', label: 'Overall' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-[10px] text-gray-500">{label}</Label>
                  <Input
                    type="number" min={4} max={9} step={0.5}
                    value={form[key as keyof CreateExpertRequest] as number ?? ''}
                    onChange={(e) => set(key as keyof CreateExpertRequest, parseFloat(e.target.value))}
                    className="text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Số năm kinh nghiệm</Label>
            <Input type="number" min={0} value={form.yearsExperience} onChange={(e) => set('yearsExperience', parseInt(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Chuyên môn</Label>
            <select
              className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.specialization}
              onChange={(e) => set('specialization', e.target.value)}
            >
              {SPECS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Giới thiệu</Label>
            <textarea
              className="w-full rounded-md border bg-white px-3 py-2 text-sm min-h-[70px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.bio} onChange={(e) => set('bio', e.target.value)}
              placeholder="Giới thiệu ngắn về giảng viên..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Huỷ</Button>
          <Button onClick={handleSubmit} disabled={loading || uploading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang tạo...</> : 'Tạo giảng viên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
