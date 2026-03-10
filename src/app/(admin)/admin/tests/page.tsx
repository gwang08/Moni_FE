'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getTests } from '@/lib/tests-api';
import { deleteTest, updateTest } from '@/lib/admin-api';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['DRAFT', 'PUBLISHED', 'HIDDEN'] as const;
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PUBLISHED: 'bg-green-100 text-green-800 border-green-200',
  HIDDEN: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function AdminTestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ id: number; status: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'tests', page],
    queryFn: () => getTests(page, 20),
    staleTime: 30_000,
  });

  const tests = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTest(String(id)),
    onSuccess: () => {
      toast.success('Đã xóa bài thi');
      queryClient.invalidateQueries({ queryKey: ['admin', 'tests'] });
      setConfirmId(null);
    },
    onError: () => toast.error('Xóa bài thi thất bại'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateTest(String(id), { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'tests', page] });
      const previous = queryClient.getQueryData(['admin', 'tests', page]);
      queryClient.setQueryData(['admin', 'tests', page], (old: typeof data) => {
        if (!old) return old;
        return { ...old, content: old.content.map(t => t.id === id ? { ...t, status } : t) };
      });
      return { previous };
    },
    onSuccess: () => toast.success('Đã cập nhật trạng thái'),
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['admin', 'tests', page], context.previous);
      toast.error('Cập nhật thất bại');
      setPendingStatus(null);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tests'] }),
  });

  return (
    <div>
      <AdminHeader title="Quản lý bài thi" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">Danh sách tất cả bài thi trong hệ thống</p>
          <Button onClick={() => router.push('/admin/tests/import')}>
            <Plus className="h-4 w-4" /> Tạo bài thi
          </Button>
        </div>

        {error && <p className="text-red-500 mb-4 text-sm">Không thể tải danh sách bài thi</p>}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tiêu đề</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kỹ năng</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Loại</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
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
                    <td className="px-4 py-3">
                      <select
                        value={test.status}
                        onChange={e => setPendingStatus({ id: test.id, status: e.target.value })}
                        className={`text-xs font-medium px-2 py-1 rounded-md border cursor-pointer ${STATUS_COLORS[test.status] || ''}`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
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

        <ConfirmDialog
          open={!!confirmId}
          onOpenChange={(open) => !open && setConfirmId(null)}
          title="Xác nhận xóa"
          description="Bạn có chắc muốn xóa bài thi này? Hành động không thể hoàn tác."
          confirmText="Xóa"
          variant="destructive"
          onConfirm={() => {
            if (confirmId) return deleteMutation.mutateAsync(confirmId);
          }}
        />

        <ConfirmDialog
          open={!!pendingStatus}
          onOpenChange={(open) => !open && setPendingStatus(null)}
          title="Xác nhận đổi trạng thái"
          description={`Bạn có chắc muốn đổi trạng thái sang ${pendingStatus?.status}?`}
          confirmText="Xác nhận"
          onConfirm={() => {
            if (pendingStatus) return statusMutation.mutateAsync(pendingStatus).then(() => setPendingStatus(null));
          }}
        />
      </div>
    </div>
  );
}
