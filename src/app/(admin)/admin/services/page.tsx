'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceFormDialog } from '@/components/admin/service-form-dialog';
import { toast } from 'sonner';
import { getServices, deleteService } from '@/lib/payment-api';
import type { ServicePricingResponse } from '@/types/payment.types';
import { SkeletonTable } from '@/components/ui/skeleton';

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServicePricingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSvc, setEditingSvc] = useState<ServicePricingResponse | undefined>();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const fetchedRef = useRef(false);
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
      <div className="p-6">
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

        <ServiceFormDialog open={dialogOpen} onOpenChange={setDialogOpen} service={editingSvc} onSuccess={fetchServices} existingCodes={services.map(s => s.serviceCode)} />

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
    </div>
  );
}
