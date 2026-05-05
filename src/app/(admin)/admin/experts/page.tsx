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
import { Plus, Loader2, Search, Star, GraduationCap } from 'lucide-react';
import type { ExpertProfile } from '@/types/expert.types';

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Online',
  BUSY: 'Bận',
  OFFLINE: 'Offline',
};

const STATUS_DOT: Record<string, string> = {
  AVAILABLE: 'bg-emerald-400',
  BUSY: 'bg-amber-400',
  OFFLINE: 'bg-gray-300',
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
      toast.error('Không thể tải danh sách giáo viên');
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
    <div>

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm giáo viên theo tên hoặc email..."
              className="pl-9 h-9"
            />
          </div>
          <Button onClick={() => setShowForm(true)} className="h-9 rounded-xl bg-gray-900 hover:bg-gray-800 text-sm px-4">
            <Plus className="h-4 w-4 mr-1.5" />
            Tạo giáo viên
          </Button>
        </div>

        {loading && experts.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['Giáo viên', 'Email', 'Band', 'Bài chấm', 'Đánh giá', 'Trạng thái'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredExperts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <GraduationCap className="h-8 w-8 mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">
                        {q ? 'Không tìm thấy giáo viên' : 'Chưa có giáo viên nào'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredExperts.map((expert) => (
                    <tr key={expert.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-9 w-9 ring-2 ring-gray-100">
                              <AvatarImage src={expert.avatarUrl} />
                              <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600 font-bold">
                                {getInitials(expert.displayName || 'X')}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${STATUS_DOT[expert.status]}`}
                              title={STATUS_LABELS[expert.status]}
                            />
                          </div>
                          <button
                            type="button"
                            className="font-semibold text-gray-800 hover:text-indigo-600 transition-colors text-left truncate max-w-[180px]"
                            onClick={() => router.push(`/admin/experts/${expert.id}`)}
                          >
                            {expert.displayName || 'Unknown'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{expert.email || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge className="font-mono text-[11px] bg-indigo-50 text-indigo-700 border-0 hover:bg-indigo-50">
                          {expert.bandScore || '0.0'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600">{expert.totalSessions || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="tabular-nums font-medium text-gray-700">{(expert.rating ?? 0).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={expert.enabled}
                            onChange={(e) => handleAccountStatusChange(expert, e.target.checked)}
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full after:shadow-sm" />
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
    </div>
  );
}
