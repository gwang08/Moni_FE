'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { getUsers, banUser } from '@/lib/admin-api';
import type { UserResponse } from '@/types/admin.types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [banningId, setBanningId] = useState<string | null>(null);

  const fetchUsers = async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers(p, 20);
      setUsers(data.content);
      setTotalPages(data.totalPages);
    } catch {
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(page); }, [page]);

  const handleBan = async (userId: string) => {
    setBanningId(userId);
    try {
      await banUser(userId);
      setConfirmId(null);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: true } : u));
    } catch {
      setError('Khóa tài khoản thất bại');
    } finally {
      setBanningId(null);
    }
  };

  return (
    <div>
      <AdminHeader title="Quản lý người dùng" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">Danh sách tất cả người dùng trong hệ thống</p>
          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            Lưu ý: Chỉ có thể khóa tài khoản, không hỗ trợ mở khóa qua API
          </p>
        </div>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Họ tên</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Điện thoại</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày tạo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chưa có người dùng nào</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{user.email}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{user.fullName}</td>
                    <td className="px-4 py-3 text-gray-500">{user.phoneNumber || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      {user.isBanned
                        ? <Badge variant="destructive">Đã khóa</Badge>
                        : <Badge variant="secondary">Hoạt động</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!user.isBanned && (
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setConfirmId(user.id)}>
                          Khóa
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
            <span className="text-sm text-gray-600">Trang {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
          </div>
        )}

        {confirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold mb-2">Xác nhận khóa tài khoản</h3>
              <p className="text-gray-600 text-sm mb-6">Bạn có chắc muốn khóa tài khoản này? Lưu ý: Không thể mở khóa qua Admin Panel.</p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setConfirmId(null)}>Hủy</Button>
                <Button variant="destructive" disabled={!!banningId} onClick={() => handleBan(confirmId)}>
                  {banningId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Khóa'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
