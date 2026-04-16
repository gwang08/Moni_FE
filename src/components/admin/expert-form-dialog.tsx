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
  email: '', 
  displayName: '', 
  avatarUrl: '',
  bandReading: 7.0, 
  bandListening: 7.0, 
  bandWriting: 7.0, 
  bandSpeaking: 7.0,
  yearsExperience: 0, 
  bio: '',
  certificates: []
};

export function ExpertFormDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateExpertRequest>(DEFAULT);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof CreateExpertRequest, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.email || !form.displayName) {
      toast.error('Vui lòng điền email và tên hiển thị');
      return;
    }
    setLoading(true);
    try {
      const expert = await createExpert(form);
      onCreated(expert);
      handleReset();
      onClose();
      toast.success('Tạo giám khảo thành công!');
    } catch {
      toast.error('Tạo giám khảo thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(DEFAULT);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { handleReset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo giám khảo mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tên hiển thị <span className="text-red-500">*</span></Label>
            <Input 
              value={form.displayName} 
              onChange={(e) => set('displayName', e.target.value)} 
              placeholder="Ví dụ: Nguyễn Văn A" 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Email <span className="text-red-500">*</span></Label>
            <Input 
              type="email"
              value={form.email} 
              onChange={(e) => set('email', e.target.value)} 
              placeholder="expert@example.com" 
            />
          </div>
          
          <p className="text-[11px] text-muted-foreground italic">
            * Mật khẩu mặc định sẽ được gửi tới email của giám khảo. Các thông tin chuyên môn khác có thể cập nhật sau.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { handleReset(); onClose(); }} disabled={loading}>Huỷ</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang tạo...</> : 'Tạo giám khảo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
