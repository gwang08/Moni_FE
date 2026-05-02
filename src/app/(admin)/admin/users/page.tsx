'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldBan, Users, Search, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getUsers, banUser } from '@/lib/admin-api';
import { toast } from 'sonner';
import { SkeletonTable } from '@/components/ui/skeleton';
import type { UserResponse } from '@/types/admin.types';

export default function AdminUsersPage() {
  const router = useRouter();
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
                  {['Họ tên', 'Email', 'Điện thoại', 'Target Band', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <Users className="h-8 w-8 mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">
                        {q ? 'Không tìm thấy người dùng' : 'Chưa có người dùng nào'}
                      </p>
                    </td>
                  </tr>
                ) : filtered.map(user => (
                  <tr
                    key={user.id ?? user.email}
                    className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                    onClick={() => user.id && router.push(`/admin/users/${user.id}`)}
                  >
                    <td className="px-4 py-3 text-gray-800 font-medium">{user.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500">{user.phoneNumber || '—'}</td>
                    <td className="px-4 py-3">
                      {user.targetBand ? (
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                          {user.targetBand}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); setBanTarget(user); }}
                          title="Ban người dùng"
                        >
                          <ShieldBan className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
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
            const id = banTarget?.id ?? banTarget?.email;
            if (id) return banMutation.mutateAsync(id);
          }}
        />
      </div>
    </div>
  );
}
