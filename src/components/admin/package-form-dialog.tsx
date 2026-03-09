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
import { createPackage, updatePackage } from '@/lib/payment-api';
import { useCurrencyInput } from '@/hooks/use-currency-format';
import type { PackagePricingResponse, PackagePricingCreateRequest, PackagePricingUpdateRequest } from '@/types/payment.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg?: PackagePricingResponse;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  price: number;
  creditAmount: number;
  isActive: boolean;
}

const defaultForm: FormState = { name: '', price: 0, creditAmount: 0, isActive: true };

export function PackageFormDialog({ open, onOpenChange, pkg, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const priceInput = useCurrencyInput(form.price, (v) => setForm(p => ({ ...p, price: v })));

  useEffect(() => {
    if (open) {
      setForm(pkg
        ? { name: pkg.name, price: pkg.price, creditAmount: pkg.creditAmount, isActive: pkg.isActive }
        : defaultForm
      );
      setError('');
    }
  }, [open, pkg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Vui lòng nhập tên gói'); return; }
    if (form.price <= 0) { setError('Vui lòng nhập giá hợp lệ'); return; }
    if (form.creditAmount <= 0) { setError('Vui lòng nhập số credits hợp lệ'); return; }
    setSubmitting(true);
    setError('');
    try {
      if (pkg) {
        const data: PackagePricingUpdateRequest = {
          name: form.name,
          price: form.price,
          creditAmount: form.creditAmount,
          isActive: form.isActive,
        };
        await updatePackage(String(pkg.id), data);
      } else {
        const data: PackagePricingCreateRequest = {
          name: form.name,
          price: form.price,
          creditAmount: form.creditAmount,
        };
        await createPackage(data);
      }
      toast.success(pkg ? 'Cập nhật gói thành công' : 'Tạo gói thành công');
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error(pkg ? 'Cập nhật gói thất bại' : 'Tạo gói thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{pkg ? 'Chỉnh sửa gói credits' : 'Tạo gói credits mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pkg-name" className="mb-1.5 block text-sm font-medium">Tên gói *</Label>
            <Input id="pkg-name" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Nhập tên gói" />
          </div>

          <div>
            <Label htmlFor="pkg-credits" className="mb-1.5 block text-sm font-medium">Credits *</Label>
            <Input id="pkg-credits" type="number" min={1} value={form.creditAmount || ''}
              onChange={e => setForm(p => ({ ...p, creditAmount: Number(e.target.value) }))}
              placeholder="Số credits" />
          </div>

          <div>
            <Label htmlFor="pkg-price" className="mb-1.5 block text-sm font-medium">Giá (VNĐ) *</Label>
            <Input id="pkg-price" inputMode="numeric" value={priceInput.displayValue}
              onChange={priceInput.onChange}
              placeholder="Nhập giá, vd: 100,000" />
          </div>

          {pkg && (
            <div className="flex items-center gap-2">
              <input id="pkg-active" type="checkbox" checked={form.isActive}
                onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                className="rounded border-gray-300" />
              <Label htmlFor="pkg-active" className="text-sm font-medium cursor-pointer">Kích hoạt</Label>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : pkg ? 'Lưu' : 'Tạo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
