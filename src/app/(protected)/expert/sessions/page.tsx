'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types/auth.types';
import type { ScoringSession } from '@/types/expert.types';

const STATUS_LABEL: Record<string, string> = {
  QUEUED: 'Đang chờ', IN_PROGRESS: 'Đang diễn ra', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ',
};
const STATUS_COLOR: Record<string, string> = {
  QUEUED: 'bg-yellow-100 text-yellow-700', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-gray-100 text-gray-500',
};

type StatusFilter = 'ALL' | 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export default function ExpertSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ScoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [startingId, setStartingId] = useState<number | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<ScoringSession[]>>('/api/v1/expert/sessions/history', true);
      setSessions(res.result ?? []);
    } catch {
      toast.error('Không thể tải danh sách phiên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const filtered = sessions
    .filter(s => statusFilter === 'ALL' || s.status === statusFilter)
    .sort((a, b) => {
      const ta = new Date(a.createdAt ?? '').getTime() || 0;
      const tb = new Date(b.createdAt ?? '').getTime() || 0;
      return sort === 'newest' ? tb - ta : ta - tb;
    });

  const handleStart = async (id: number) => {
    if (startingId) return;
    setStartingId(id);
    try {
      await apiClient.patch<ApiResponse<ScoringSession>>(`/api/v1/expert/sessions/${id}/start`, {}, true);
      toast.success('Đã nhận phiên!');
      router.push(`/expert/session/${id}`);
    } catch {
      toast.error('Không thể bắt đầu phiên');
      setStartingId(null);
    }
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Phiên chấm điểm</h1>
        <Button variant="outline" size="sm" onClick={fetchSessions} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['ALL', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s === 'ALL' ? 'Tất cả' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as 'newest' | 'oldest')}
          className="text-xs border rounded-md px-2 py-1.5 bg-white">
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} phiên</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Phiên', 'Kỹ năng', 'Trạng thái', 'Đánh giá', 'Thời gian', 'Bản ghi', 'Hành động'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Không có phiên nào</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">#{s.id}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{s.skill}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs border-0 ${STATUS_COLOR[s.status]}`}>{STATUS_LABEL[s.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {s.userRating ? <span className="text-xs">{'⭐'.repeat(s.userRating)}</span> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {s.recordingUrl && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground w-10 shrink-0">User:</span>
                          <audio controls src={s.recordingUrl} className="h-7 w-32" />
                        </div>
                      )}
                      {s.expertRecordingUrl && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground w-10 shrink-0">Bạn:</span>
                          <audio controls src={s.expertRecordingUrl} className="h-7 w-32" />
                        </div>
                      )}
                      {!s.recordingUrl && !s.expertRecordingUrl && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {s.status === 'QUEUED' && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleStart(s.id)} disabled={startingId === s.id}>
                          {startingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Nhận phiên'}
                        </Button>
                      )}
                      {s.status === 'IN_PROGRESS' && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => router.push(`/expert/session/${s.id}`)}>
                          Tiếp tục
                        </Button>
                      )}
                      {s.status === 'COMPLETED' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                          onClick={() => router.push(`/expert/session/${s.id}`)}>
                          <Eye className="h-3 w-3" /> Xem lại
                        </Button>
                      )}
                      {s.status === 'CANCELLED' && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
