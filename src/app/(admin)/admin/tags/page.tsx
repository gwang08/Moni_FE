'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { TagFormDialog } from '@/components/admin/tag-form-dialog';
import { getTags, deleteTag } from '@/lib/admin-api';
import type { TagResponse } from '@/types/admin.types';

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagResponse | undefined>();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTags = async () => {
    setLoading(true);
    setError('');
    try {
      setTags(await getTags());
    } catch {
      setError('Không thể tải danh sách tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTags(); }, []);

  const openCreate = () => { setEditingTag(undefined); setDialogOpen(true); };
  const openEdit = (tag: TagResponse) => { setEditingTag(tag); setDialogOpen(true); };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTag(id);
      setConfirmId(null);
      setTags(prev => prev.filter(t => t.id !== id));
    } catch {
      setError('Xóa tag thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <AdminHeader title="Quản lý Tags" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">Quản lý các tags phân loại bài thi</p>
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Tạo tag</Button>
        </div>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tên</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Loại</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mô tả</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tags.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chưa có tag nào</td></tr>
                ) : tags.map(tag => (
                  <tr key={tag.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{tag.name}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{tag.type}</Badge></td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{tag.description || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon-sm" variant="ghost" onClick={() => openEdit(tag)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" className="text-red-500 hover:text-red-700"
                          onClick={() => setConfirmId(tag.id)}>
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

        <TagFormDialog open={dialogOpen} onOpenChange={setDialogOpen} tag={editingTag} onSuccess={fetchTags} />

        {confirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold mb-2">Xác nhận xóa tag</h3>
              <p className="text-gray-600 text-sm mb-6">Bạn có chắc muốn xóa tag này?</p>
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
