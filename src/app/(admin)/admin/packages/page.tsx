'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { PackageFormDialog } from '@/components/admin/package-form-dialog';
import { toast } from 'sonner';
import { getPackages, deletePackage } from '@/lib/payment-api';
import type { PackagePricingResponse } from '@/types/payment.types';
import { SkeletonTable } from '@/components/ui/skeleton';

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackagePricingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackagePricingResponse | undefined>();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  useEffect(() => { fetchPackages(); }, []);

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
      <AdminHeader title="Quản lý Gói Credits" />
      <div className="p-6">
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
                    <td className="px-4 py-3 text-gray-700">{pkg.price.toLocaleString('vi-VN')} đ</td>
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
    </div>
  );
}
