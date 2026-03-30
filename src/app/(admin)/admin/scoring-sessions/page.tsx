'use client';

import { useEffect, useState, useMemo } from 'react';
import { Headphones, Loader2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { ScoringSession } from '@/types/expert.types';
import { toast } from 'sonner';

type SessionStatus = ScoringSession['status'];

const STATUS_LABEL: Record<SessionStatus, string> = {
  QUEUED: 'Chờ xử lý',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};

const STATUS_CLASS: Record<SessionStatus, string> = {
  QUEUED: 'bg-yellow-100 text-yellow-800 border-0',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-0',
  COMPLETED: 'bg-green-100 text-green-800 border-0',
  CANCELLED: 'bg-gray-100 text-gray-500 border-0',
};

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function AdminScoringSessionsPage() {
  const [sessions, setSessions] = useState<ScoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    apiClient
      .get<ApiResponse<ScoringSession[]>>('/api/v1/scoring-sessions/admin/all', true)
      .then((res) => setSessions(res.result ?? []))
      .catch(() => toast.error('Không thể tải danh sách phiên chấm điểm'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const matchSearch = search
        ? s.expertDisplayName?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchStatus = statusFilter === 'ALL' ? true : s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sessions, search, statusFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Headphones className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Công việc expert</h1>
          <p className="text-sm text-muted-foreground">Toàn bộ công việc chấm điểm của expert trong hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Tìm theo tên giảng viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm w-44"
        >
          <option value="ALL">Tất cả</option>
          <option value="QUEUED">Chờ xử lý</option>
          <option value="IN_PROGRESS">Đang diễn ra</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã huỷ</option>
        </select>
        <span className="text-sm text-muted-foreground self-center">{filtered.length} phiên</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Headphones className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Không có phiên nào.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kỹ năng</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Giảng viên</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ngày tạo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Đánh giá</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bản ghi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((session) => (
                <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{session.id}</td>
                  <td className="px-4 py-3 font-medium">{session.skill}</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.expertDisplayName || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_CLASS[session.status]}>
                      {STATUS_LABEL[session.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {session.createdAt
                      ? new Date(session.createdAt).toLocaleDateString('vi-VN')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StarRating rating={session.userRating} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {session.recordingUrl && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground w-12 shrink-0">User:</span>
                          <audio controls src={session.recordingUrl} className="h-7 w-36" />
                        </div>
                      )}
                      {session.expertRecordingUrl && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground w-12 shrink-0">Expert:</span>
                          <audio controls src={session.expertRecordingUrl} className="h-7 w-36" />
                        </div>
                      )}
                      {!session.recordingUrl && !session.expertRecordingUrl && (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
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
