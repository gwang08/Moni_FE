'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExpertFormDialog } from '@/components/admin/expert-form-dialog';
import { getAdminExperts, updateExpertAccountStatus } from '@/lib/admin-expert-api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Search } from 'lucide-react';
import type { ExpertProfile } from '@/types/expert.types';

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Hoạt động',
  BUSY: 'Đang bận',
  OFFLINE: 'Vô hiệu hóa',
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminExpertsPage() {
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const fetchExperts = async () => {
    setLoading(true);
    try {
      const data = await getAdminExperts();
      setExperts(data);
    } catch {
      toast.error('Không thể tải danh sách giám khảo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperts();
  }, []);

  const handleAccountStatusChange = async (expert: ExpertProfile, enabled: boolean) => {
    try {
      const updated = await updateExpertAccountStatus(expert.id, enabled);
      setExperts((prev) =>
        prev.map((e) => (e.id === expert.id ? updated : e))
      );
      toast.success(`Tài khoản đã được ${enabled ? 'kích hoạt' : 'vô hiệu hóa'}`);
    } catch {
      toast.error('Không thể cập nhật trạng thái tài khoản');
    }
  };

  const q = search.toLowerCase().trim();
  const filteredExperts = q
    ? experts.filter((e) => 
        (e.displayName || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q)
      )
    : experts;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý giám khảo</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo giám khảo mới
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm giám khảo theo tên hoặc email..."
          className="pl-9"
        />
      </div>

      <div className="mb-4">
        <p className="text-muted-foreground text-sm">
          Có {filteredExperts.length} giám khảo
          {search && ` (Tìm kiếm: "${search}")`}
        </p>
      </div>

      {loading && experts.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Giám khảo', 'Email', 'Band Score', 'Bài đã chấm', 'Đánh giá', 'Trạng thái'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredExperts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    {q ? 'Không tìm thấy giám khảo' : 'Chưa có giám khảo nào'}
                  </td>
                </tr>
              ) : (
                filteredExperts.map((expert) => (
                  <tr key={expert.id} className="border-b hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-9 w-9 border">
                            <AvatarImage src={expert.avatarUrl} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(expert.displayName || 'X')}
                            </AvatarFallback>
                          </Avatar>
                          {/* Messenger-style Status Dot (Working Status) */}
                          <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-white ${
                            expert.status === 'AVAILABLE' ? 'bg-green-500' : 
                            expert.status === 'BUSY' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} title={STATUS_LABELS[expert.status]} />
                        </div>
                        <button
                          type="button"
                          className="font-medium hover:text-primary hover:underline transition-colors text-left truncate max-w-[180px]"
                          onClick={() => router.push(`/admin/experts/${expert.id}`)}
                        >
                          {expert.displayName || 'Unknown'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">
                      {expert.email || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-mono">{expert.bandScore || '0.0'}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600">{expert.totalSessions || 0}</td>
                    <td className="px-4 py-3 tabular-nums font-medium">{(expert.rating ?? 0).toFixed(1)}</td>
                    <td className="px-4 py-3">
                      {/* Account Activation Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={expert.enabled}
                          onChange={(e) => handleAccountStatusChange(expert, e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-[#50d764] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 shadow-sm"></div>
                      </label>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ExpertFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onCreated={(expert) => setExperts((prev) => [expert, ...prev])}
      />
    </div>
  );
}
