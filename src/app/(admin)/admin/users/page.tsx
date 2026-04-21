'use client';

import { useState } from 'react';
import { ShieldBan, Users, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminHeader } from '@/components/admin/admin-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getUsers, banUser } from '@/lib/admin-api';
import { toast } from 'sonner';
import { SkeletonTable } from '@/components/ui/skeleton';
import type { UserResponse } from '@/types/admin.types';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [banTarget, setBanTarget] = useState<UserResponse | null>(null);
  const [search, setSearch] = useState('');

  const { data: allUsers = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: getUsers,
  });

  const users = allUsers.filter(u => !u.role || u.role === 'LEARNER');

  const q = search.toLowerCase().trim();
  const filtered = q
    ? users.filter(u =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.full_name || '').toLowerCase().includes(q)
      )
    : users;

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
      <AdminHeader title="Quản lý người dùng" description={`${users.length} học viên trong hệ thống`} />

      <div className="p-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo email hoặc tên..."
            className="pl-9 h-9"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            Không thể tải danh sách người dùng
          </div>
        )}

        {isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['Email', 'Họ tên', 'Điện thoại', 'Ngày sinh', 'Target Band', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <Users className="h-8 w-8 mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">
                        {q ? 'Không tìm thấy người dùng' : 'Chưa có người dùng nào'}
                      </p>
                    </td>
                  </tr>
                ) : filtered.map(user => (
                  <tr key={user.email} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 font-medium">{user.email}</td>
                    <td className="px-4 py-3 text-gray-800">{user.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{user.phoneNumber || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {user.targetBand ? (
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">
                          {user.targetBand}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setBanTarget(user)}
                        >
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
