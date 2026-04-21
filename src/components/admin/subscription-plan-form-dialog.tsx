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
import { adminCreateSubscriptionPlan, adminUpdateSubscriptionPlan } from '@/lib/subscription-api';
import { useCurrencyInput } from '@/hooks/use-currency-format';
import type { SubscriptionPlanResponse, SubscriptionPlanUpsertRequest } from '@/types/subscription.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: SubscriptionPlanResponse;
  onSuccess: () => void;
}

interface FormState {
  code: string;
  name: string;
  description: string;
  priceVnd: number;
  durationDays: number;
  quotaAi: number;
  quotaExpert: number;
  category: string;
  isActive: boolean;
}

const defaultForm: FormState = {
  code: '',
  name: '',
  description: '',
  priceVnd: 0,
  durationDays: 30,
  quotaAi: 0,
  quotaExpert: 0,
  category: 'SCORING',
  isActive: true,
};

export function SubscriptionPlanFormDialog({ open, onOpenChange, plan, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const priceInput = useCurrencyInput(form.priceVnd, (v) => setForm(p => ({ ...p, priceVnd: v })));

  const isEditing = !!plan;

  useEffect(() => {
    if (open) {
      setForm(plan
        ? {
            code: plan.code,
            name: plan.name,
            description: plan.description || '',
            priceVnd: plan.priceVnd,
            durationDays: plan.durationDays,
            quotaAi: plan.quotaAi,
            quotaExpert: plan.quotaExpert,
            category: plan.category || 'SCORING',
            isActive: plan.isActive,
          }
        : defaultForm,
      );
      setError('');
    }
  }, [open, plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { setError('Vui lòng nhập mã code'); return; }
    if (!form.name.trim()) { setError('Vui lòng nhập tên gói'); return; }
    if (form.priceVnd < 0) { setError('Giá không được âm'); return; }
    if (form.durationDays <= 0) { setError('Thời hạn phải lớn hơn 0'); return; }

    setSubmitting(true);
    setError('');
    try {
      const data: SubscriptionPlanUpsertRequest = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        priceVnd: form.priceVnd,
        durationDays: form.durationDays,
        quotaAi: form.quotaAi,
        quotaExpert: form.quotaExpert,
        category: form.category as 'SCORING' | 'ROADMAP',
        isActive: form.isActive,
      };
      if (plan) {
        await adminUpdateSubscriptionPlan(plan.id, data);
      } else {
        await adminCreateSubscriptionPlan(data);
      }
      toast.success(plan ? 'Cập nhật gói subscription thành công' : 'Tạo gói subscription thành công');
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error(plan ? 'Cập nhật thất bại' : 'Tạo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Chỉnh sửa gói Subscription' : 'Tạo gói Subscription mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sp-code" className="mb-1.5 block text-sm font-medium">Mã code *</Label>
              <Input
                id="sp-code"
                value={form.code}
                onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                placeholder="VD: BASIC_MONTHLY"
                disabled={isEditing}
              />
            </div>
            <div>
              <Label htmlFor="sp-duration" className="mb-1.5 block text-sm font-medium">Thời hạn (ngày) *</Label>
              <Input
                id="sp-duration"
                type="number"
                min={1}
                value={form.durationDays || ''}
                onChange={e => setForm(p => ({ ...p, durationDays: Number(e.target.value) }))}
                placeholder="30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sp-name" className="mb-1.5 block text-sm font-medium">Tên gói *</Label>
              <Input
                id="sp-name"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="VD: Gói Cơ Bản"
              />
            </div>
            <div>
              <Label htmlFor="sp-category" className="mb-1.5 block text-sm font-medium">Loại gói</Label>
              <select
                id="sp-category"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isEditing}
              >
                <option value="SCORING">Chấm điểm</option>
                <option value="ROADMAP">Lộ trình</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="sp-price" className="mb-1.5 block text-sm font-medium">Giá (VNĐ)</Label>
            <Input
              id="sp-price"
              inputMode="numeric"
              value={priceInput.displayValue}
              onChange={priceInput.onChange}
              placeholder="VD: 99,000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sp-quota-ai" className="mb-1.5 block text-sm font-medium">Quota AI</Label>
              <Input
                id="sp-quota-ai"
                type="number"
                min={-1}
                value={form.quotaAi === 0 ? '' : form.quotaAi}
                onChange={e => setForm(p => ({ ...p, quotaAi: Number(e.target.value) }))}
                placeholder="-1"
              />
              <p className="mt-1 text-xs text-gray-400">Nhập -1 để không giới hạn</p>
            </div>
            <div>
              <Label htmlFor="sp-quota-expert" className="mb-1.5 block text-sm font-medium">Quota Expert</Label>
              <Input
                id="sp-quota-expert"
                type="number"
                min={0}
                value={form.quotaExpert || ''}
                onChange={e => setForm(p => ({ ...p, quotaExpert: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sp-desc" className="mb-1.5 block text-sm font-medium">Mô tả</Label>
            <textarea
              id="sp-desc"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả gói subscription (tùy chọn)"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="sp-active"
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="sp-active" className="text-sm font-medium cursor-pointer">Kích hoạt</Label>
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
