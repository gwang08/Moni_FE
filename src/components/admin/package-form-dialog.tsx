'use client';

import { useState, useEffect } from 'react';
import { Loader2, Package, Coins, Banknote, ToggleRight } from 'lucide-react';
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
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/10">
                <Package className="h-4.5 w-4.5" />
              </div>
              {pkg ? 'Chỉnh sửa gói credits' : 'Tạo gói credits mới'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <Label htmlFor="pkg-name" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <Package className="h-3.5 w-3.5" />
              Tên gói
            </Label>
            <Input id="pkg-name" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Nhập tên gói" className="h-10" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pkg-credits" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Coins className="h-3.5 w-3.5" />
                Credits
              </Label>
              <Input id="pkg-credits" type="number" min={1} value={form.creditAmount || ''}
                onChange={e => setForm(p => ({ ...p, creditAmount: Number(e.target.value) }))}
                placeholder="Số credits" className="h-10" />
            </div>
            <div>
              <Label htmlFor="pkg-price" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Banknote className="h-3.5 w-3.5" />
                Giá (VND)
              </Label>
              <Input id="pkg-price" inputMode="numeric" value={priceInput.displayValue}
                onChange={priceInput.onChange}
                placeholder="VD: 100,000" className="h-10" />
            </div>
          </div>

          {pkg && (
            <div className="flex items-center gap-2.5 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="pkg-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
              </label>
              <Label htmlFor="pkg-active" className="text-sm font-medium cursor-pointer flex items-center gap-1.5 text-gray-700">
                <ToggleRight className="h-4 w-4" />
                Kích hoạt
              </Label>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="h-10 rounded-xl px-5" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={submitting} className="h-10 rounded-xl px-6 bg-gray-900 hover:bg-gray-800">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              {pkg ? 'Lưu thay đổi' : 'Tạo gói'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
