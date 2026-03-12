'use client';

import { useState } from 'react';
import { ShieldBan } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminHeader } from '@/components/admin/admin-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getUsers, banUser } from '@/lib/admin-api';
import { toast } from 'sonner';
import { SkeletonTable } from '@/components/ui/skeleton';
import type { UserResponse } from '@/types/admin.types';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [banTarget, setBanTarget] = useState<UserResponse | null>(null);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: getUsers,
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => banUser(userId),
    onSuccess: () => {
      toast.success('Đã ban người dùng');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setBanTarget(null);
    },
    onError: () => toast.error('Ban người dùng thất bại'),
  });

  return (
    <div>
      <AdminHeader title="Quản lý người dùng" />
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-6">Danh sách tất cả người dùng trong hệ thống</p>

        {error && <p className="text-red-500 mb-4 text-sm">Không thể tải danh sách người dùng</p>}

        {isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Họ tên</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Điện thoại</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày sinh</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Target Band</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chưa có người dùng nào</td></tr>
                ) : users.map(user => (
                  <tr key={user.email} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{user.email}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{user.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{user.phoneNumber || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{user.targetBand ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Button size="icon-sm" variant="ghost" className="text-red-500 hover:text-red-700"
                          onClick={() => setBanTarget(user)}>
                          <ShieldBan className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmDialog
          open={!!banTarget}
          onOpenChange={(open) => !open && setBanTarget(null)}
          title="Ban người dùng"
          description={`Bạn có chắc muốn ban "${banTarget?.full_name || banTarget?.email}"? Người dùng sẽ không thể đăng nhập.`}
          confirmText="Ban"
          variant="destructive"
          onConfirm={() => {
            if (banTarget?.email) return banMutation.mutateAsync(banTarget.email);
          }}
        />
      </div>
    </div>
  );
}
