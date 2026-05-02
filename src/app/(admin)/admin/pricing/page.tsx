'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, Plus, Pencil, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PackageFormDialog } from '@/components/admin/package-form-dialog';
import { SubscriptionPlanFormDialog } from '@/components/admin/subscription-plan-form-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getPackages, updatePackage } from '@/lib/payment-api';
import { adminListSubscriptionPlans, adminUpdateSubscriptionPlan } from '@/lib/subscription-api';
import { formatVnd } from '@/lib/utils';
import type { PackagePricingResponse } from '@/types/payment.types';
import type { SubscriptionPlanResponse } from '@/types/subscription.types';

/* ── Toggle Switch ── */
function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${checked ? 'bg-emerald-500 focus-visible:ring-emerald-500' : 'bg-gray-200 focus-visible:ring-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0
          transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
      {disabled && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-3 w-3 animate-spin text-white" />
        </span>
      )}
    </button>
  );
}

export default function AdminPricingPage() {
  return (
    <div>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <section id="packages" className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-500" />
              <h3 className="font-bold text-sm">Gói lượt chấm</h3>
            </div>
            <div className="p-6">
              <PackagesTab />
            </div>
          </section>

          <section id="subscriptions" className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="font-bold text-sm">Gói lộ trình</h3>
            </div>
            <div className="p-6">
              <SubscriptionsTab />
            </div>
          </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Packages tab
// ---------------------------------------------------------------------------
function PackagesTab() {
  const [packages, setPackages] = useState<PackagePricingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackagePricingResponse | undefined>();
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const fetchedRef = useRef(false);

  const fetchPackages = async () => {
    setLoading(true);
    setError('');
    try {
      setPackages(await getPackages());
    } catch {
      setError('Không thể tải danh sách gói credits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchPackages();
  }, []);

  const openCreate = () => { setEditingPkg(undefined); setDialogOpen(true); };
  const openEdit = (pkg: PackagePricingResponse) => { setEditingPkg(pkg); setDialogOpen(true); };

  const handleToggleActive = async (pkg: PackagePricingResponse) => {
    setTogglingId(pkg.id);
    try {
      const updated = await updatePackage(String(pkg.id), { isActive: !pkg.isActive });
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, isActive: updated.isActive ?? !pkg.isActive } : p));
      toast.success(pkg.isActive ? `Đã tắt gói "${pkg.name}"` : `Đã bật gói "${pkg.name}"`);
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">Quản lý các gói lượt chấm cho người dùng mua</p>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Tạo gói</Button>
      </div>

      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tên</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Lượt AI</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Lượt Expert</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Giá (VNĐ)</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chưa có gói nào</td></tr>
              ) : packages.map(pkg => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{pkg.name}</td>
                  <td className="px-4 py-3 text-center text-gray-700 font-semibold">{pkg.quotaAi}</td>
                  <td className="px-4 py-3 text-center text-gray-700 font-semibold">{pkg.quotaExpert}</td>
                  <td className="px-4 py-3 text-gray-700">{formatVnd(pkg.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <ToggleSwitch
                        checked={pkg.isActive}
                        disabled={togglingId === pkg.id}
                        onChange={() => handleToggleActive(pkg)}
                      />
                      <span className={`text-xs font-medium ${pkg.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {pkg.isActive ? 'Bật' : 'Tắt'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon-sm" variant="ghost" onClick={() => openEdit(pkg)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PackageFormDialog open={dialogOpen} onOpenChange={setDialogOpen} pkg={editingPkg} onSuccess={fetchPackages} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subscriptions tab
// ---------------------------------------------------------------------------
function SubscriptionsTab() {
  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanResponse | undefined>();
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const fetchedRef = useRef(false);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      setPlans(await adminListSubscriptionPlans());
    } catch {
      setError('Không thể tải danh sách gói subscription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchPlans();
  }, []);

  const openCreate = () => { setEditingPlan(undefined); setDialogOpen(true); };
  const openEdit = (p: SubscriptionPlanResponse) => { setEditingPlan(p); setDialogOpen(true); };

  const handleToggleActive = async (plan: SubscriptionPlanResponse) => {
    setTogglingId(plan.id);
    try {
      const updated = await adminUpdateSubscriptionPlan(plan.id, { isActive: !plan.isActive });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isActive: updated.isActive ?? !plan.isActive } : p));
      toast.success(plan.isActive ? `Đã tắt gói "${plan.name}"` : `Đã bật gói "${plan.name}"`);
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">Quản lý các gói lộ trình cho người dùng đăng ký</p>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Tạo gói</Button>
      </div>

      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {loading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tên</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Giá (VND)</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Thời hạn</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Quota AI</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Quota Expert</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Chưa có gói nào</td></tr>
              ) : plans.map(plan => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{plan.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{plan.name}</td>
                  <td className="px-4 py-3 text-gray-700">{formatVnd(plan.priceVnd)}</td>
                  <td className="px-4 py-3 text-gray-700">{plan.durationDays} ngày</td>
                  <td className="px-4 py-3 text-gray-700">
                    {plan.quotaAi === -1 ? 'Không giới hạn' : plan.quotaAi}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{plan.quotaExpert}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <ToggleSwitch
                        checked={plan.isActive}
                        disabled={togglingId === plan.id}
                        onChange={() => handleToggleActive(plan)}
                      />
                      <span className={`text-xs font-medium ${plan.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {plan.isActive ? 'Bật' : 'Tắt'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon-sm" variant="ghost" onClick={() => openEdit(plan)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SubscriptionPlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={editingPlan}
        onSuccess={fetchPlans}
      />
    </div>
  );
}
