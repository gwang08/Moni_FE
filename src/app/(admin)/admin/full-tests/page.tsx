'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shuffle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FullTestCreateDialog } from '@/components/admin/full-test-create-dialog';
import { FullTestAutoDialog } from '@/components/admin/full-test-auto-dialog';
import { getFullTests, deleteFullTest } from '@/lib/admin-full-test-api';
import { toast } from 'sonner';
import { SkeletonTable } from '@/components/ui/skeleton';

const SKILL_BADGE: Record<string, string> = {
  READING: 'bg-blue-100 text-blue-800 border-blue-200',
  LISTENING: 'bg-purple-100 text-purple-800 border-purple-200',
  SPEAKING: 'bg-orange-100 text-orange-800 border-orange-200',
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PUBLISHED: 'bg-green-100 text-green-800 border-green-200',
  HIDDEN: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function AdminFullTestsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: fullTests = [], isLoading } = useQuery({
    queryKey: ['full-tests'],
    queryFn: getFullTests,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFullTest,
    onSuccess: () => {
      toast.success('Đã xóa Full Test');
      queryClient.invalidateQueries({ queryKey: ['full-tests'] });
    },
    onError: () => toast.error('Xóa thất bại'),
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader title="Quản lý Full Test" />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{fullTests.length} full test</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAutoOpen(true)}>
              <Shuffle className="h-4 w-4 mr-2" />
              Tạo ngẫu nhiên
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo Full Test
            </Button>
          </div>
        </div>

        {isLoading ? (
          <SkeletonTable />
        ) : fullTests.length === 0 ? (
          <div className="text-center py-16 text-gray-400 border rounded-lg">
            Chưa có Full Test nào. Hãy tạo mới!
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tên đề</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kỹ năng</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Số section</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Thời gian</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày tạo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fullTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{test.title}</td>
                    <td className="px-4 py-3">
                      <Badge className={SKILL_BADGE[test.skill] ?? 'bg-gray-100 text-gray-700'}>
                        {test.skill}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{test.stimuli?.length ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {test.duration ? `${test.duration} phút` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_BADGE[test.status] ?? 'bg-gray-100 text-gray-700'}>
                        {test.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(test.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmId(test.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FullTestCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <FullTestAutoDialog open={autoOpen} onClose={() => setAutoOpen(false)} />

      <ConfirmDialog
        open={confirmId !== null}
        title="Xóa Full Test"
        description="Bạn có chắc muốn xóa Full Test này không?"
        onConfirm={() => {
          if (confirmId !== null) deleteMutation.mutate(confirmId);
          setConfirmId(null);
        }}
        onOpenChange={(open) => { if (!open) setConfirmId(null); }}
      />
    </div>
  );
}
