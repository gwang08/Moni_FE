'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { getTests } from '@/lib/tests-api';
import { deleteTest } from '@/lib/admin-api';
import type { TestResponse } from '@/types/test.types';

export default function AdminTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchTests = async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await getTests(p, 20);
      setTests(data.content);
      setTotalPages(data.totalPages);
    } catch {
      setError('Không thể tải danh sách bài thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTests(page); }, [page]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTest(id);
      setConfirmId(null);
      fetchTests(page);
    } catch {
      setError('Xóa bài thi thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <AdminHeader title="Quản lý bài thi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">Danh sách tất cả bài thi trong hệ thống</p>
          <Button onClick={() => router.push('/admin/tests/import')}>
            <Plus className="h-4 w-4" />
            Tạo bài thi
          </Button>
        </div>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tiêu đề</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kỹ năng</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Loại</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày tạo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tests.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">Chưa có bài thi nào</td></tr>
                ) : tests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{test.title}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{test.skill}</Badge></td>
                    <td className="px-4 py-3 text-gray-600">{test.testType}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(test.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/tests/${test.id}`}>
                          <Button size="icon-sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Link href={`/admin/tests/${test.id}/edit`}>
                          <Button size="icon-sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                        </Link>
                        <Button size="icon-sm" variant="ghost" className="text-red-500 hover:text-red-700"
                          onClick={() => setConfirmId(test.id)}>
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
              <h3 className="text-lg font-semibold mb-2">Xác nhận xóa</h3>
              <p className="text-gray-600 text-sm mb-6">Bạn có chắc muốn xóa bài thi này? Hành động không thể hoàn tác.</p>
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
