'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getAdminExperts } from '@/lib/admin-expert-api';
import { apiClient } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, BarChart3, Star, Calendar, FileText, CheckCircle, TimerReset } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { ExpertProfile, ScoringSession } from '@/types/expert.types';
import type { ApiResponse } from '@/types/auth.types';

interface DateRange {
  startDate: string;
  endDate: string;
}

function getInitials(name?: string) {
  if (!name) return 'EX';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminExpertReportsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  
  const today = useMemo(() => new Date(), []);
  const defaultFromDate = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 30);
    return date;
  }, [today]);

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: defaultFromDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  });

  const { data: experts = [], isLoading: isLoadingExperts } = useQuery({
    queryKey: ['admin-experts'],
    queryFn: getAdminExperts,
  });

  const { data: allSessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['admin-expert-all-sessions'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ScoringSession[]>>('/api/v1/scoring-sessions/admin/all', true);
      return res.result ?? [];
    },
  });

  const isLoading = isLoadingExperts || isLoadingSessions;

  const reportData = useMemo(() => {
    if (!experts.length || !dateRange.startDate || !dateRange.endDate) return [];

    const startDate = new Date(dateRange.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);

    // Map experts to their stats
    const statsMap = new Map(experts.map(e => [e.id, {
      expert: e,
      totalSessions: 0,
      completedSessions: 0,
      speakingSessions: 0,
      writingSessions: 0,
      totalRating: 0,
      ratingCount: 0,
      totalDurationMs: 0,
      durationCount: 0,
    }]));

    // Process sessions
    allSessions.forEach(session => {
      if (!session.expertId || !statsMap.has(session.expertId)) return;

      const dateStr = session.endedAt || session.createdAt;
      if (!dateStr) return;

      const dateObj = new Date(dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`);
      if (dateObj >= startDate && dateObj <= endDate) {
        const stats = statsMap.get(session.expertId)!;
        stats.totalSessions++;

        if (session.status === 'COMPLETED') {
          stats.completedSessions++;
          if (session.skill === 'SPEAKING') stats.speakingSessions++;
          if (session.skill === 'WRITING') stats.writingSessions++;
          
          if (session.userRating) {
            stats.totalRating += session.userRating;
            stats.ratingCount++;
          }

          if (session.startedAt && session.endedAt) {
            const start = new Date(session.startedAt.includes('Z') ? session.startedAt : `${session.startedAt}Z`).getTime();
            const end = new Date(session.endedAt.includes('Z') ? session.endedAt : `${session.endedAt}Z`).getTime();
            if (end > start) {
              stats.totalDurationMs += (end - start);
              stats.durationCount++;
            }
          }
        }
      }
    });

    return Array.from(statsMap.values()).map(s => {
      const averageRating = s.ratingCount > 0 ? (s.totalRating / s.ratingCount) : 0;
      const averageDurationMs = s.durationCount > 0 ? (s.totalDurationMs / s.durationCount) : 0;
      const averageDurationMin = Math.round(averageDurationMs / 60000); // convert ms to minutes

      return {
        ...s,
        averageRating,
        averageDurationMin,
      };
    });
  }, [experts, allSessions, dateRange]);

  const q = search.toLowerCase().trim();
  const filteredData = q
    ? reportData.filter((d) =>
        (d.expert.displayName || '').toLowerCase().includes(q) ||
        (d.expert.email || '').toLowerCase().includes(q)
      )
    : reportData;

  // Calculate totals for the selected month
  const totalMonthSessions = reportData.reduce((sum, d) => sum + d.totalSessions, 0);
  const totalMonthCompleted = reportData.reduce((sum, d) => sum + d.completedSessions, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            Báo cáo Hiệu suất Giáo viên
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Thống kê số lượng bài chấm, chất lượng và thời gian trung bình theo khoảng thời gian
          </p>
        </div>
      </div>

      {/* Filters: Search and Date Range on 1 line */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm giáo viên theo tên hoặc email..."
            className="pl-10 h-10 rounded-xl bg-white border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
          />
        </div>
        <div className="w-full sm:w-[280px]">
          <DateRangePicker 
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      {/* Summary Stats (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 shadow-sm p-5 flex items-center gap-5">
          <div className="p-3.5 bg-white rounded-xl shadow-sm text-indigo-600">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-wide mb-1">Tổng bài phân công</p>
            <p className="text-3xl font-black text-indigo-900">{totalMonthSessions}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 shadow-sm p-5 flex items-center gap-5">
          <div className="p-3.5 bg-white rounded-xl shadow-sm text-emerald-600">
            <CheckCircle className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wide mb-1">Tổng bài đã chấm</p>
            <p className="text-3xl font-black text-emerald-900">{totalMonthCompleted}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-gray-500">Đang tải dữ liệu báo cáo...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Giáo viên</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiến độ</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Kỹ năng</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tốc độ</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <BarChart3 className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                      <p className="text-sm text-gray-500 font-medium">Không có dữ liệu báo cáo</p>
                      <p className="text-xs text-gray-400 mt-1">Thử chọn ngày khác hoặc thay đổi từ khóa tìm kiếm</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr key={row.expert.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <button 
                          className="flex items-center gap-4 text-left group/teacher w-full"
                          onClick={() => router.push(`/admin/experts/${row.expert.id}`)}
                        >
                          <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover/teacher:ring-indigo-100 shadow-sm transition-all">
                            <AvatarImage src={row.expert.avatarUrl} />
                            <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600 font-bold">
                              {getInitials(row.expert.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-semibold text-gray-900 group-hover/teacher:text-indigo-600 transition-colors block truncate max-w-[200px]">
                              {row.expert.displayName || 'Giáo viên chưa có tên'}
                            </span>
                            <span className="text-[12px] text-gray-500 truncate max-w-[200px] block">{row.expert.email}</span>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-gray-900">{row.completedSessions}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-sm text-gray-500 font-medium">{row.totalSessions}</span>
                          </div>
                          {row.totalSessions > 0 && (
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${row.completedSessions === row.totalSessions ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${Math.min(100, Math.round((row.completedSessions / row.totalSessions) * 100))}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-medium text-gray-400 uppercase">Speaking</span>
                            <span className="font-semibold text-blue-600">{row.speakingSessions}</span>
                          </div>
                          <div className="h-6 w-px bg-gray-200"></div>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-medium text-gray-400 uppercase">Writing</span>
                            <span className="font-semibold text-purple-600">{row.writingSessions}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-600">
                          <TimerReset className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm font-medium">{row.averageDurationMin > 0 ? `${row.averageDurationMin}p` : '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.averageRating > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100/50 text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-bold">{row.averageRating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500">
                            <span className="text-xs font-medium italic">-</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
