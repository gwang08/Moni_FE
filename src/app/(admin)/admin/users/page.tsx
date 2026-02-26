'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminHeader } from '@/components/admin/admin-header';
import { getUsers } from '@/lib/admin-api';
import type { UserResponse } from '@/types/admin.types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setError('Không thể tải danh sách người dùng'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <AdminHeader title="Quản lý người dùng" />
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-6">Danh sách tất cả người dùng trong hệ thống</p>

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
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày sinh</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Target Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">Chưa có người dùng nào</td></tr>
                ) : users.map(user => (
                  <tr key={user.email} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{user.email}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{user.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{user.phoneNumber || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{user.targetBand ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
