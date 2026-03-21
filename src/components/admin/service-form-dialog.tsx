'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createService, updateService } from '@/lib/payment-api';
import type { ServicePricingResponse, ServicePricingCreateRequest } from '@/types/payment.types';

const SERVICE_OPTIONS = [
  { code: 'AI_WRITING_SCORE', name: 'Chấm Writing bằng AI', description: 'Chấm bài Writing Task 1/2 tự động bằng AI' },
  { code: 'AI_SPEAKING_SCORE', name: 'Chấm Speaking bằng AI', description: 'Chấm bài Speaking tự động bằng AI' },
  { code: 'EXPERT_WRITING_SCORE', name: 'Chấm Writing với Giảng viên', description: 'Chấm bài Writing trực tiếp với giảng viên qua video call' },
  { code: 'EXPERT_SPEAKING_SCORE', name: 'Chấm Speaking với Giảng viên', description: 'Chấm bài Speaking trực tiếp với giảng viên qua video call' },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: ServicePricingResponse;
  onSuccess: () => void;
}

interface FormState {
  serviceCode: string;
  creditCost: number;
  description: string;
}

const defaultForm: FormState = { serviceCode: '', creditCost: 0, description: '' };

export function ServiceFormDialog({ open, onOpenChange, service, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!service;

  useEffect(() => {
    if (open) {
      setForm(service
        ? { serviceCode: service.serviceCode, creditCost: service.creditCost, description: service.description || '' }
        : defaultForm
      );
      setError('');
    }
  }, [open, service]);

  const selectedOption = SERVICE_OPTIONS.find(o => o.code === form.serviceCode);

  const handleSelectService = (code: string) => {
    const option = SERVICE_OPTIONS.find(o => o.code === code);
    if (option) {
      setForm(p => ({ ...p, serviceCode: code, description: option.description }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceCode) { setError('Vui lòng chọn dịch vụ'); return; }
    if (form.creditCost <= 0) { setError('Vui lòng nhập chi phí credits hợp lệ'); return; }
    setSubmitting(true);
    setError('');
    try {
      const data: ServicePricingCreateRequest = {
        name: selectedOption?.name || form.serviceCode,
        serviceCode: form.serviceCode,
        creditCost: form.creditCost,
        description: form.description || undefined,
      };
      if (service) {
        await updateService(String(service.id), data);
      } else {
        await createService(data);
      }
      toast.success(service ? 'Cập nhật dịch vụ thành công' : 'Tạo dịch vụ thành công');
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error(service ? 'Cập nhật dịch vụ thất bại' : 'Tạo dịch vụ thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Chỉnh sửa dịch vụ' : 'Tạo dịch vụ mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="svc-select" className="mb-1.5 block text-sm font-medium">Dịch vụ *</Label>
            <select
              id="svc-select"
              value={form.serviceCode}
              onChange={e => handleSelectService(e.target.value)}
              disabled={isEditing}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">-- Chọn dịch vụ --</option>
              {SERVICE_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="svc-cost" className="mb-1.5 block text-sm font-medium">Chi phí (credits) *</Label>
            <Input id="svc-cost" type="number" min={1} value={form.creditCost || ''}
              onChange={e => setForm(p => ({ ...p, creditCost: Number(e.target.value) }))}
              placeholder="Số credits cần dùng" />
          </div>

          <div>
            <Label htmlFor="svc-desc" className="mb-1.5 block text-sm font-medium">Mô tả</Label>
            <textarea id="svc-desc" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả dịch vụ (tùy chọn)" rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? 'Lưu' : 'Tạo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
