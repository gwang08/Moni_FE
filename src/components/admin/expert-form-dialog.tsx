'use client';

import { useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createExpert } from '@/lib/admin-expert-api';
import { uploadMedia } from '@/lib/admin-api';
import { toast } from 'sonner';
import { Loader2, Plus, Camera, X, ImagePlus } from 'lucide-react';
import type { ExpertProfile, CreateExpertRequest } from '@/types/expert.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (expert: ExpertProfile) => void;
}

const BAND_FIELDS = [
  { key: 'bandReading', label: 'Reading' },
  { key: 'bandListening', label: 'Listening' },
  { key: 'bandWriting', label: 'Writing' },
  { key: 'bandSpeaking', label: 'Speaking' },
] as const;

const DEFAULT: CreateExpertRequest = {
  email: '', displayName: '', avatarUrl: '',
  bandReading: 6, bandListening: 6, bandWriting: 7, bandSpeaking: 7,
  yearsExperience: 1, bio: '',
};

// Round average to nearest 0.5
function calcOverall(r: number, l: number, w: number, s: number): number {
  const avg = (r + l + w + s) / 4;
  return Math.round(avg * 2) / 2;
}

export function ExpertFormDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateExpertRequest>(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [certPreviews, setCertPreviews] = useState<string[]>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof CreateExpertRequest, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const overall = calcOverall(
    form.bandReading ?? 0,
    form.bandListening ?? 0,
    form.bandWriting ?? 0,
    form.bandSpeaking ?? 0,
  );

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleCertSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setCertFiles((prev) => [...prev, ...files]);
    setCertPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeCert = (idx: number) => {
    URL.revokeObjectURL(certPreviews[idx]);
    setCertFiles((prev) => prev.filter((_, i) => i !== idx));
    setCertPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.email || !form.displayName) {
      toast.error('Vui lòng điền email và tên hiển thị');
      return;
    }
    setLoading(true);
    try {
      // Upload avatar
      let avatarUrl = form.avatarUrl;
      if (avatarFile) avatarUrl = await uploadMedia(avatarFile);

      // Upload all certificates
      const certificates: string[] = await Promise.all(certFiles.map((f) => uploadMedia(f)));

      const expert = await createExpert({ ...form, avatarUrl, certificates });
      onCreated(expert);
      handleReset();
      onClose();
      toast.success('Tạo giảng viên thành công!');
    } catch {
      toast.error('Tạo giảng viên thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    certPreviews.forEach((p) => URL.revokeObjectURL(p));
    setForm(DEFAULT);
    setAvatarPreview('');
    setAvatarFile(null);
    setCertFiles([]);
    setCertPreviews([]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { handleReset(); onClose(); } }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo giảng viên mới</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          {/* Avatar upload */}
          <div className="col-span-2 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={loading}
              className="group relative h-20 w-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center shrink-0 hover:border-primary hover:bg-gray-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {avatarPreview ? (
                <>
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-0.5 text-gray-400 group-hover:text-primary transition-colors">
                  <Plus className="h-6 w-6" />
                  <span className="text-[9px] font-medium">Tải ảnh</span>
                </div>
              )}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
            <span className="text-[10px] text-gray-400">Ảnh đại diện</span>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Email <span className="text-red-500">*</span></Label>
            <Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="expert@example.com" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tên hiển thị <span className="text-red-500">*</span></Label>
            <Input value={form.displayName} onChange={(e) => set('displayName', e.target.value)} placeholder="Nguyễn Văn A" />
          </div>

          {/* Band scores */}
          <div className="col-span-2">
            <Label className="text-xs font-medium mb-2 block">Điểm IELTS <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-5 gap-2">
              {BAND_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-[10px] text-gray-500">{label}</Label>
                  <Input
                    type="number" min={4} max={9} step={0.5}
                    value={form[key] ?? ''}
                    onChange={(e) => set(key, parseFloat(e.target.value))}
                    className="text-center"
                  />
                </div>
              ))}
              {/* Auto-calculated Overall */}
              <div className="space-y-1">
                <Label className="text-[10px] text-gray-500">Overall</Label>
                <div className="h-10 flex items-center justify-center rounded-md border bg-gray-50 text-sm font-semibold text-primary">
                  {overall.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Số năm kinh nghiệm <span className="text-red-500">*</span></Label>
            <Input
              type="number" min={0}
              value={form.yearsExperience}
              onChange={(e) => set('yearsExperience', parseInt(e.target.value))}
              className="w-1/2"
            />
          </div>

          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Giới thiệu</Label>
            <textarea
              className="w-full rounded-md border bg-white px-3 py-2 text-sm min-h-[70px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.bio} onChange={(e) => set('bio', e.target.value)}
              placeholder="Giới thiệu ngắn về giảng viên..."
            />
          </div>

          {/* Certificates multi-upload */}
          <div className="col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Bằng cấp / Chứng chỉ</Label>
              <button
                type="button"
                onClick={() => certInputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Thêm ảnh
              </button>
            </div>
            <input ref={certInputRef} type="file" accept="image/*" multiple onChange={handleCertSelect} className="hidden" />
            {certPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {certPreviews.map((src, i) => (
                  <div key={i} className="relative group h-16 w-16 rounded border overflow-hidden bg-gray-100">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeCert(i)}
                      className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {certPreviews.length === 0 && (
              <button
                type="button"
                onClick={() => certInputRef.current?.click()}
                disabled={loading}
                className="w-full border-2 border-dashed border-gray-200 rounded-md p-4 text-center text-xs text-gray-400 hover:border-primary hover:text-primary transition-colors"
              >
                Kéo thả hoặc nhấn để chọn ảnh chứng chỉ
              </button>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { handleReset(); onClose(); }} disabled={loading}>Huỷ</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang tạo...</> : 'Tạo giảng viên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
