'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExpertFormDialog } from '@/components/admin/expert-form-dialog';
import { ExpertDetailDialog } from '@/components/admin/expert-detail-dialog';
import { getAdminExperts, updateExpertStatus, deleteExpert } from '@/lib/admin-expert-api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Ban, CheckCircle, Loader2, Search } from 'lucide-react';
import type { ExpertProfile } from '@/types/expert.types';

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
  BUSY: 'Đang bận',
  OFFLINE: 'Ngoại tuyến',
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  BUSY: 'bg-yellow-100 text-yellow-700',
  OFFLINE: 'bg-gray-100 text-gray-600',
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminExpertsPage() {
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);
  const [search, setSearch] = useState('');

  const fetchExperts = async () => {
    setLoading(true);
    try {
      setExperts(await getAdminExperts());
    } catch {
      toast.error('Không thể tải danh sách giám khảo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExperts(); }, []);

  const handleToggleBan = async (expert: ExpertProfile) => {
    const isBanning = expert.status !== 'OFFLINE';
    const newStatus = isBanning ? 'OFFLINE' : 'AVAILABLE';
    try {
      await updateExpertStatus(expert.id, newStatus);
      setExperts((prev) =>
        prev.map((e) => (e.id === expert.id ? { ...e, status: newStatus as ExpertProfile['status'] } : e))
      );
      toast.success(isBanning ? 'Đã vô hiệu hoá giám khảo' : 'Đã kích hoạt giám khảo');
    } catch {
      toast.error('Không thể cập nhật');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xoá giám khảo này?')) return;
    setDeletingId(id);
    try {
      await deleteExpert(id);
      setExperts((prev) => prev.filter((e) => e.id !== id));
      toast.success('Đã xoá giám khảo');
    } catch {
      toast.error('Không thể xoá giám khảo');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExpertUpdated = (updated: ExpertProfile) => {
    setExperts((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedExpert(updated);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý giám khảo</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Tổng: {experts.length} giám khảo
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo giám khảo mới
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm giám khảo theo tên hoặc email..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Giám khảo', 'Band Score', 'Trạng thái', 'Phiên', 'Đánh giá', 'Hành động'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const q = search.toLowerCase().trim();
                const filtered = q
                  ? experts.filter((e) => e.displayName.toLowerCase().includes(q))
                  : experts;
                return filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    {q ? 'Không tìm thấy giám khảo' : 'Chưa có giám khảo nào'}
                  </td>
                </tr>
              ) : (
                filtered.map((expert) => (
                  <tr key={expert.id} className="border-b hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={expert.avatarUrl} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(expert.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Clickable name opens detail dialog */}
                        <button
                          type="button"
                          className="font-medium hover:text-primary hover:underline transition-colors text-left"
                          onClick={() => setSelectedExpert(expert)}
                        >
                          {expert.displayName}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{expert.bandScore}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[expert.status]}`}>
                        {STATUS_LABELS[expert.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{expert.totalSessions}</td>
                    <td className="px-4 py-3 tabular-nums">{expert.rating.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title={expert.status === 'OFFLINE' ? 'Kích hoạt' : 'Vô hiệu hoá'}
                          onClick={() => handleToggleBan(expert)}
                        >
                          {expert.status === 'OFFLINE'
                            ? <CheckCircle className="h-4 w-4 text-green-600" />
                            : <Ban className="h-4 w-4 text-orange-500" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(expert.id)}
                          disabled={deletingId === expert.id}
                        >
                          {deletingId === expert.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              );
              })()}
            </tbody>
          </table>
        </div>
      )}

      <ExpertFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onCreated={(expert) => setExperts((prev) => [expert, ...prev])}
      />

      <ExpertDetailDialog
        expert={selectedExpert}
        open={!!selectedExpert}
        onClose={() => setSelectedExpert(null)}
        onUpdated={handleExpertUpdated}
      />
    </div>
  );
}
