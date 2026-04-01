'use client';

import { useEffect, useMemo, useState } from 'react';
import { Headphones, Loader2, Star } from 'lucide-react';
import Link from 'next/link';
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

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const normalized = value.includes('Z') || value.includes('+') ? value : `${value}Z`;
  return new Date(normalized).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSessionMoment(session: ScoringSession): string {
  return session.endedAt || session.submittedAt || session.createdAt || '';
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

  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState(formatDateInput(defaultFromDate));
  const [toDate, setToDate] = useState(formatDateInput(today));

  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedSkillFilter, setAppliedSkillFilter] = useState('ALL');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('ALL');
  const [appliedFromDate, setAppliedFromDate] = useState(formatDateInput(defaultFromDate));
  const [appliedToDate, setAppliedToDate] = useState(formatDateInput(today));

  useEffect(() => {
    apiClient
      .get<ApiResponse<ScoringSession[]>>('/api/v1/scoring-sessions/admin/all', true)
      .then((res) => setSessions(res.result ?? []))
      .catch(() => toast.error('Không thể tải danh sách bài chấm của giám khảo'))
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
      const needle = appliedSearchTerm.toLowerCase();
      const matchSearch = appliedSearchTerm
        ? [
            session.userDisplayName || '',
            session.expertDisplayName || '',
            String(session.id),
            session.skill || '',
          ].some((value) => value.toLowerCase().includes(needle))
        : true;
      const matchSkill = appliedSkillFilter === 'ALL' ? true : session.skill === appliedSkillFilter;
      const matchStatus = appliedStatusFilter === 'ALL' ? true : session.status === appliedStatusFilter;

      let matchDate = true;
      const moment = getSessionMoment(session);
      if (moment && (start !== null || end !== null)) {
        const timestamp = new Date(moment).getTime();
        if (start !== null && timestamp < start) matchDate = false;
        if (end !== null && timestamp > end) matchDate = false;
      }

      return matchSearch && matchSkill && matchStatus && matchDate;
    });
  }, [sessions, appliedSearchTerm, appliedSkillFilter, appliedStatusFilter, appliedFromDate, appliedToDate]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Headphones className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bài chấm</h1>
          <p className="text-sm text-muted-foreground">Toàn bộ bài chấm điểm của giám khảo trong hệ thống</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            placeholder="Tìm theo thí sinh, giám khảo, ID..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
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
              setAppliedSearchTerm(searchTerm.trim());
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
          <p>Không có bài chấm nào.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kỹ năng</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Thí sinh</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Giám khảo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Thời gian nộp/chấm</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Đánh giá</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((session) => (
                <tr key={session.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    <Link href={`/admin/scoring-sessions/${session.id}`} className="font-medium text-blue-600 hover:underline">
                      #{session.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{session.skill}</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.userDisplayName || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.expertDisplayName || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_CLASS[session.status]}>{STATUS_LABEL[session.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(getSessionMoment(session))}
                  </td>
                  <td className="px-4 py-3">
                    <StarRating rating={session.userRating} />
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
