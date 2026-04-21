'use client';

import { useState, useEffect } from 'react';
import { Loader2, Settings, Coins, FileText } from 'lucide-react';
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
  { code: 'EXPERT_WRITING_SCORE', name: 'Chấm Writing với giám khảo', description: 'Chấm bài Writing trực tiếp với giám khảo qua video call' },
  { code: 'EXPERT_SPEAKING_SCORE', name: 'Chấm Speaking với giám khảo', description: 'Chấm bài Speaking trực tiếp với giám khảo qua video call' },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: ServicePricingResponse;
  onSuccess: () => void;
  existingCodes?: string[];
}

interface FormState {
  serviceCode: string;
  creditCost: number;
  description: string;
}

const defaultForm: FormState = { serviceCode: '', creditCost: 0, description: '' };

export function ServiceFormDialog({ open, onOpenChange, service, onSuccess, existingCodes = [] }: Props) {
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
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/10">
                <Settings className="h-4.5 w-4.5" />
              </div>
              {isEditing ? 'Chỉnh sửa dịch vụ' : 'Tạo dịch vụ mới'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <Label htmlFor="svc-select" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <Settings className="h-3.5 w-3.5" />
              Dịch vụ
            </Label>
            <select
              id="svc-select"
              value={form.serviceCode}
              onChange={e => handleSelectService(e.target.value)}
              disabled={isEditing}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">-- Chọn dịch vụ --</option>
              {SERVICE_OPTIONS
                .filter(opt => isEditing || !existingCodes.includes(opt.code))
                .map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="svc-cost" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <Coins className="h-3.5 w-3.5" />
              Chi phí (credits)
            </Label>
            <Input id="svc-cost" type="number" min={1} value={form.creditCost || ''}
              onChange={e => setForm(p => ({ ...p, creditCost: Number(e.target.value) }))}
              placeholder="Số credits cần dùng" className="h-10" />
          </div>

          <div>
            <Label htmlFor="svc-desc" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <FileText className="h-3.5 w-3.5" />
              Mô tả
            </Label>
            <textarea id="svc-desc" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả dịch vụ (tùy chọn)" rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="h-10 rounded-xl px-5" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={submitting} className="h-10 rounded-xl px-6 bg-gray-900 hover:bg-gray-800">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              {isEditing ? 'Lưu thay đổi' : 'Tạo dịch vụ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
