'use client';

import { useRef, useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { updateExpert } from '@/lib/admin-expert-api';
import { uploadMedia } from '@/lib/admin-api';
import { toast } from 'sonner';
import { Loader2, Camera, ImagePlus, X } from 'lucide-react';
import type { ExpertProfile, UpdateExpertRequest } from '@/types/expert.types';

interface Props {
  expert: ExpertProfile | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (expert: ExpertProfile) => void;
}

const BAND_FIELDS = [
  { key: 'bandReading', label: 'Reading' },
  { key: 'bandListening', label: 'Listening' },
  { key: 'bandWriting', label: 'Writing' },
  { key: 'bandSpeaking', label: 'Speaking' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
  BUSY: 'Đang bận',
  OFFLINE: 'Ngoại tuyến',
};
const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  BUSY: 'bg-yellow-100 text-yellow-700',
  OFFLINE: 'bg-gray-100 text-gray-600',
};

function calcOverall(r: number, l: number, w: number, s: number): number {
  return Math.round(((r + l + w + s) / 4) * 2) / 2;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function ExpertDetailDialog({ expert, open, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<UpdateExpertRequest>({});
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [certPreviews, setCertPreviews] = useState<string[]>([]);
  const [existingCerts, setExistingCerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  // Sync form state when expert changes
  useEffect(() => {
    if (!expert) return;
    setForm({
      displayName: expert.displayName,
      avatarUrl: expert.avatarUrl,
      bandReading: expert.bandReading,
      bandListening: expert.bandListening,
      bandWriting: expert.bandWriting,
      bandSpeaking: expert.bandSpeaking,
      yearsExperience: expert.yearsExperience,
      bio: expert.bio,
    });
    setAvatarPreview('');
    setAvatarFile(null);
    setCertFiles([]);
    setCertPreviews([]);
    setExistingCerts(expert.certificates ?? []);
  }, [expert]);

  const set = <K extends keyof UpdateExpertRequest>(key: K, value: UpdateExpertRequest[K]) =>
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

  const removeNewCert = (idx: number) => {
    URL.revokeObjectURL(certPreviews[idx]);
    setCertFiles((prev) => prev.filter((_, i) => i !== idx));
    setCertPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingCert = (idx: number) =>
    setExistingCerts((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!expert) return;
    setLoading(true);
    try {
      let avatarUrl = form.avatarUrl;
      if (avatarFile) avatarUrl = await uploadMedia(avatarFile);

      const uploadedCerts: string[] = await Promise.all(certFiles.map((f) => uploadMedia(f)));
      const certificates = [...existingCerts, ...uploadedCerts];

      const updated = await updateExpert(expert.id, { ...form, avatarUrl, certificates });
      onUpdated(updated);
      toast.success('Cập nhật thành công!');
      onClose();
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const currentAvatar = avatarPreview || form.avatarUrl || '';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết giám khảo</DialogTitle>
        </DialogHeader>

        {expert && (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="info" className="flex-1">Thông tin</TabsTrigger>
              <TabsTrigger value="certs" className="flex-1">Bằng cấp</TabsTrigger>
            </TabsList>

            {/* --- Thông tin tab --- */}
            <TabsContent value="info" className="space-y-4">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={loading}
                  className="group relative h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300 bg-gray-100 hover:border-primary transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {currentAvatar ? (
                    <>
                      <img src={currentAvatar} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <Avatar className="h-full w-full">
                      <AvatarImage src={expert.avatarUrl} />
                      <AvatarFallback className="text-lg">{getInitials(expert.displayName)}</AvatarFallback>
                    </Avatar>
                  )}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Tên hiển thị</Label>
                  <Input value={form.displayName ?? ''} onChange={(e) => set('displayName', e.target.value)} />
                </div>

                <div className="space-y-1 col-span-2">
                  <Label className="text-xs text-gray-500">Email</Label>
                  <Input value={expert.email ?? ''} placeholder="(không có thông tin)" disabled className="bg-gray-50" />
                </div>

                {/* Band scores */}
                <div className="col-span-2">
                  <Label className="text-xs font-medium mb-2 block">Điểm IELTS</Label>
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
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500">Overall</Label>
                      <div className="h-10 flex items-center justify-center rounded-md border bg-gray-50 text-sm font-semibold text-primary">
                        {overall.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Số năm kinh nghiệm</Label>
                  <Input
                    type="number" min={0}
                    value={form.yearsExperience ?? ''}
                    onChange={(e) => set('yearsExperience', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <Label className="text-xs text-gray-500">Trạng thái</Label>
                  <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium w-fit ${STATUS_COLORS[expert.status]}`}>
                    {STATUS_LABELS[expert.status]}
                  </div>
                </div>

                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Giới thiệu</Label>
                  <textarea
                    className="w-full rounded-md border bg-white px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.bio ?? ''}
                    onChange={(e) => set('bio', e.target.value)}
                    placeholder="Giới thiệu ngắn về giám khảo..."
                  />
                </div>

                <div className="col-span-2 flex gap-4 text-sm text-muted-foreground">
                  <span>Tổng phiên: <strong className="text-foreground">{expert.totalSessions || 0}</strong></span>
                  <span>Đánh giá: <strong className="text-foreground">{(expert.rating ?? 0).toFixed(1)}</strong></span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang lưu...</> : 'Lưu thay đổi'}
                </Button>
              </div>
            </TabsContent>

            {/* --- Bằng cấp tab --- */}
            <TabsContent value="certs" className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Bằng cấp / Chứng chỉ</Label>
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

              {/* Existing certs */}
              {existingCerts.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-1.5">Đã lưu</p>
                  <div className="grid grid-cols-3 gap-2">
                    {existingCerts.map((src, i) => (
                      <div key={i} className="relative group aspect-[4/3] rounded border overflow-hidden bg-gray-100">
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingCert(i)}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New certs staged for upload */}
              {certPreviews.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-1.5">Chờ tải lên</p>
                  <div className="grid grid-cols-3 gap-2">
                    {certPreviews.map((src, i) => (
                      <div key={i} className="relative group aspect-[4/3] rounded border-2 border-dashed border-primary/40 overflow-hidden bg-gray-50">
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewCert(i)}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingCerts.length === 0 && certPreviews.length === 0 && (
                <button
                  type="button"
                  onClick={() => certInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-md p-6 text-center text-xs text-gray-400 hover:border-primary hover:text-primary transition-colors"
                >
                  Kéo thả hoặc nhấn để thêm ảnh chứng chỉ
                </button>
              )}

              {(certPreviews.length > 0 || existingCerts.length > 0) && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang lưu...</> : 'Lưu thay đổi'}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
