'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { ServiceFormDialog } from '@/components/admin/service-form-dialog';
import { PackageFormDialog } from '@/components/admin/package-form-dialog';
import { SubscriptionPlanFormDialog } from '@/components/admin/subscription-plan-form-dialog';
import { SkeletonTable } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getServices, deleteService, getPackages, deletePackage } from '@/lib/payment-api';
import { adminListSubscriptionPlans, adminDeleteSubscriptionPlan } from '@/lib/subscription-api';
import { formatVnd } from '@/lib/utils';
import type { ServicePricingResponse, PackagePricingResponse } from '@/types/payment.types';
import type { SubscriptionPlanResponse } from '@/types/subscription.types';

type Tab = 'services' | 'packages' | 'subscriptions';

export default function AdminPricingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('services');

  return (
    <div>
      <AdminHeader title="Quản lý giá cả" />
      <div className="p-6">
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {([
            { key: 'services', label: 'Dịch vụ' },
            { key: 'packages', label: 'Gói nạp' },
            { key: 'subscriptions', label: 'Gói Subscription' },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'services' && <ServicesTab />}
        {activeTab === 'packages' && <PackagesTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Services tab
// ---------------------------------------------------------------------------
function ServicesTab() {
  const [services, setServices] = useState<ServicePricingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSvc, setEditingSvc] = useState<ServicePricingResponse | undefined>();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fetchedRef = useRef(false);

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      setServices(await getServices());
    } catch {
      setError('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchServices();
  }, []);

  const openCreate = () => { setEditingSvc(undefined); setDialogOpen(true); };
  const openEdit = (svc: ServicePricingResponse) => { setEditingSvc(svc); setDialogOpen(true); };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteService(String(id));
      toast.success('Xóa dịch vụ thành công');
      setConfirmId(null);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch {
      toast.error('Xóa dịch vụ thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">Quản lý các dịch vụ và chi phí credits tương ứng</p>
        {services.length < 4 && (
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Tạo dịch vụ</Button>
        )}
      </div>

      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {loading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tên dịch vụ</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Chi phí (credits)</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Mô tả</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chưa có dịch vụ nào</td></tr>
              ) : services.map(svc => (
                <tr key={svc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{svc.name}</td>
                  <td className="px-4 py-3 text-gray-700">{svc.creditCost.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{svc.description || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon-sm" variant="ghost" onClick={() => openEdit(svc)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" className="text-red-500 hover:text-red-700"
                        onClick={() => setConfirmId(svc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editingSvc}
        onSuccess={fetchServices}
        existingCodes={services.map(s => s.serviceCode)}
      />

      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Xác nhận xóa dịch vụ</h3>
            <p className="text-gray-600 text-sm mb-6">Bạn có chắc muốn xóa dịch vụ này?</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmId(null)}>Hủy</Button>
              <Button variant="destructive" disabled={!!deletingId} onClick={() => handleDelete(confirmId)}>
                {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Xóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
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
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deletePackage(String(id));
      toast.success('Xóa gói thành công');
      setConfirmId(null);
      setPackages(prev => prev.filter(p => p.id !== id));
    } catch {
      toast.error('Xóa gói thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">Quản lý các gói credits cho người dùng mua</p>
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
                <th className="px-4 py-3 text-left font-medium text-gray-600">Credits</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Giá (VNĐ)</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Chưa có gói nào</td></tr>
              ) : packages.map(pkg => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{pkg.name}</td>
                  <td className="px-4 py-3 text-gray-700">{pkg.creditAmount.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-gray-700">{formatVnd(pkg.price)}</td>
                  <td className="px-4 py-3">
                    {pkg.isActive
                      ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Hoạt động</Badge>
                      : <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100">Tạm dừng</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon-sm" variant="ghost" onClick={() => openEdit(pkg)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" className="text-red-500 hover:text-red-700"
                        onClick={() => setConfirmId(pkg.id)}>
                        <Trash2 className="h-4 w-4" />
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

      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Xác nhận xóa gói</h3>
            <p className="text-gray-600 text-sm mb-6">Bạn có chắc muốn xóa gói credits này?</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmId(null)}>Hủy</Button>
              <Button variant="destructive" disabled={!!deletingId} onClick={() => handleDelete(confirmId)}>
                {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Xóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
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
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await adminDeleteSubscriptionPlan(id);
      toast.success('Xóa gói subscription thành công');
      setConfirmId(null);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch {
      toast.error('Xóa gói subscription thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">Quản lý các gói subscription cho người dùng đăng ký</p>
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
                <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
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
                    {plan.isActive
                      ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Hoạt động</Badge>
                      : <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100">Tạm dừng</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon-sm" variant="ghost" onClick={() => openEdit(plan)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" className="text-red-500 hover:text-red-700"
                        onClick={() => setConfirmId(plan.id)}>
                        <Trash2 className="h-4 w-4" />
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

      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Xác nhận xóa gói subscription</h3>
            <p className="text-gray-600 text-sm mb-6">
              Gói sẽ bị vô hiệu hóa (soft delete). Lịch sử đăng ký vẫn được giữ nguyên.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmId(null)}>Hủy</Button>
              <Button variant="destructive" disabled={!!deletingId} onClick={() => handleDelete(confirmId)}>
                {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Xóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
