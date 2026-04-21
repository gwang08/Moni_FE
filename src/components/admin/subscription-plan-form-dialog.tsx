'use client';

import { useState, useEffect } from 'react';
import { Loader2, Package, Tag, Calendar, Coins, Bot, GraduationCap, FileText, ToggleRight } from 'lucide-react';
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
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/10">
                <Package className="h-4.5 w-4.5" />
              </div>
              {isEditing ? 'Chỉnh sửa gói Subscription' : 'Tạo gói Subscription mới'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Row 1: Code + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sp-code" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Tag className="h-3.5 w-3.5" />
                Mã code
              </Label>
              <Input
                id="sp-code"
                value={form.code}
                onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                placeholder="VD: BASIC_MONTHLY"
                disabled={isEditing}
                className="h-10 font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="sp-duration" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Calendar className="h-3.5 w-3.5" />
                Thời hạn (ngày)
              </Label>
              <Input
                id="sp-duration"
                type="number"
                min={1}
                value={form.durationDays || ''}
                onChange={e => setForm(p => ({ ...p, durationDays: Number(e.target.value) }))}
                placeholder="30"
                className="h-10"
              />
            </div>
          </div>

          {/* Row 2: Name + Category */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="sp-name" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Package className="h-3.5 w-3.5" />
                Tên gói
              </Label>
              <Input
                id="sp-name"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="VD: Gói Cơ Bản"
                className="h-10"
              />
            </div>
            <div>
              <Label htmlFor="sp-category" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Loại
              </Label>
              <select
                id="sp-category"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isEditing}
              >
                <option value="SCORING">Chấm điểm</option>
                <option value="ROADMAP">Lộ trình</option>
              </select>
            </div>
          </div>

          {/* Row 3: Price */}
          <div>
            <Label htmlFor="sp-price" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <Coins className="h-3.5 w-3.5" />
              Giá (VND)
            </Label>
            <Input
              id="sp-price"
              inputMode="numeric"
              value={priceInput.displayValue}
              onChange={priceInput.onChange}
              placeholder="VD: 99,000"
              className="h-10"
            />
          </div>

          {/* Row 4: Quotas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sp-quota-ai" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Bot className="h-3.5 w-3.5" />
                Quota AI
              </Label>
              <Input
                id="sp-quota-ai"
                type="number"
                min={-1}
                value={form.quotaAi === 0 ? '' : form.quotaAi}
                onChange={e => setForm(p => ({ ...p, quotaAi: Number(e.target.value) }))}
                placeholder="-1"
                className="h-10"
              />
              <p className="mt-1 text-[11px] text-gray-400">-1 = không giới hạn</p>
            </div>
            <div>
              <Label htmlFor="sp-quota-expert" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <GraduationCap className="h-3.5 w-3.5" />
                Quota Expert
              </Label>
              <Input
                id="sp-quota-expert"
                type="number"
                min={0}
                value={form.quotaExpert || ''}
                onChange={e => setForm(p => ({ ...p, quotaExpert: Number(e.target.value) }))}
                placeholder="0"
                className="h-10"
              />
            </div>
          </div>

          {/* Row 5: Description */}
          <div>
            <Label htmlFor="sp-desc" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <FileText className="h-3.5 w-3.5" />
              Mô tả
            </Label>
            <textarea
              id="sp-desc"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả gói subscription (tùy chọn)"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Row 6: Active toggle */}
          <div className="flex items-center gap-2.5 pt-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="sp-active"
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
            </label>
            <Label htmlFor="sp-active" className="text-sm font-medium cursor-pointer flex items-center gap-1.5 text-gray-700">
              <ToggleRight className="h-4 w-4" />
              Kích hoạt
            </Label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="h-10 rounded-xl px-5" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting} className="h-10 rounded-xl px-6 bg-gray-900 hover:bg-gray-800">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              {isEditing ? 'Lưu thay đổi' : 'Tạo gói'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
