'use client';

import { useEffect, useMemo, useState } from 'react';
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

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-muted-foreground text-xs">-</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function AdminScoringSessionsPage() {
  const [sessions, setSessions] = useState<ScoringSession[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const defaultFromDate = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 30);
    return date;
  }, [today]);

  const [expertName, setExpertName] = useState('');
  const [skillFilter, setSkillFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState(formatDateInput(defaultFromDate));
  const [toDate, setToDate] = useState(formatDateInput(today));

  const [appliedExpertName, setAppliedExpertName] = useState('');
  const [appliedSkillFilter, setAppliedSkillFilter] = useState('ALL');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('ALL');
  const [appliedFromDate, setAppliedFromDate] = useState(formatDateInput(defaultFromDate));
  const [appliedToDate, setAppliedToDate] = useState(formatDateInput(today));

  useEffect(() => {
    apiClient
      .get<ApiResponse<ScoringSession[]>>('/api/v1/scoring-sessions/admin/all', true)
      .then((res) => setSessions(res.result ?? []))
      .catch(() => toast.error('Không thể tải danh sách công việc expert'))
      .finally(() => setLoading(false));
  }, []);

  const availableSkills = useMemo(() => {
    const skills = new Set<string>();
    for (const session of sessions) {
      if (session.skill) skills.add(session.skill);
    }
    return Array.from(skills).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    const start = appliedFromDate ? new Date(`${appliedFromDate}T00:00:00`).getTime() : null;
    const end = appliedToDate ? new Date(`${appliedToDate}T23:59:59`).getTime() : null;

    return sessions.filter((session) => {
      const matchExpert = appliedExpertName
        ? (session.expertDisplayName || '').toLowerCase().includes(appliedExpertName.toLowerCase())
        : true;
      const matchSkill = appliedSkillFilter === 'ALL' ? true : session.skill === appliedSkillFilter;
      const matchStatus = appliedStatusFilter === 'ALL' ? true : session.status === appliedStatusFilter;

      let matchDate = true;
      if (session.createdAt && (start !== null || end !== null)) {
        const createdAt = new Date(session.createdAt).getTime();
        if (start !== null && createdAt < start) matchDate = false;
        if (end !== null && createdAt > end) matchDate = false;
      }

      return matchExpert && matchSkill && matchStatus && matchDate;
    });
  }, [sessions, appliedExpertName, appliedSkillFilter, appliedStatusFilter, appliedFromDate, appliedToDate]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Headphones className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Công việc</h1>
          <p className="text-sm text-muted-foreground">Toàn bộ công việc chấm điểm của expert trong hệ thống</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            placeholder="Tìm theo tên expert..."
            value={expertName}
            onChange={(event) => setExpertName(event.target.value)}
            className="max-w-xs"
          />
          <select
            value={skillFilter}
            onChange={(event) => setSkillFilter(event.target.value)}
            className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="ALL">Tất cả kỹ năng</option>
            {availableSkills.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="QUEUED">Chờ xử lý</option>
            <option value="IN_PROGRESS">Đang diễn ra</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã huỷ</option>
          </select>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Từ ngày</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Đến ngày</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setAppliedExpertName(expertName.trim());
              setAppliedSkillFilter(skillFilter);
              setAppliedStatusFilter(statusFilter);
              setAppliedFromDate(fromDate);
              setAppliedToDate(toDate);
            }}
            className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Tìm kiếm
          </button>
          <span className="self-center text-sm text-muted-foreground">{filtered.length} phiên</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Headphones className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>Không có công việc nào.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kỹ năng</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expert</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ngày tạo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Đánh giá</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bản ghi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((session) => (
                <tr key={session.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{session.id}</td>
                  <td className="px-4 py-3 font-medium">{session.skill}</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.expertDisplayName || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_CLASS[session.status]}>{STATUS_LABEL[session.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {session.createdAt ? new Date(session.createdAt).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <StarRating rating={session.userRating} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {session.recordingUrl && (
                        <div className="flex items-center gap-1">
                          <span className="w-12 shrink-0 text-[10px] text-muted-foreground">User:</span>
                          <audio controls src={session.recordingUrl} className="h-7 w-36" />
                        </div>
                      )}
                      {session.expertRecordingUrl && (
                        <div className="flex items-center gap-1">
                          <span className="w-12 shrink-0 text-[10px] text-muted-foreground">Expert:</span>
                          <audio controls src={session.expertRecordingUrl} className="h-7 w-36" />
                        </div>
                      )}
                      {!session.recordingUrl && !session.expertRecordingUrl && (
                        <span className="text-xs text-muted-foreground">-</span>
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
