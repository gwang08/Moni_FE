'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Bot, Coins, FileText, UserPlus, Users } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { getAdminRevenueDashboard } from '@/lib/admin-api';
import { AdminHeader } from '@/components/admin/admin-header';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DateRange {
  startDate: string;
  endDate: string;
}

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const vndAxisFormatter = (value: number) => {
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    const formatted = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1_000_000_000);
    return `${formatted}B`;
  }

  if (abs >= 1_000_000) {
    const formatted = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1_000_000);
    return `${formatted}M`;
  }

  if (abs >= 1_000) {
    const formatted = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1_000);
    return `${formatted}K`;
  }

  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
};

export default function AdminDashboardPage() {
  const today = useMemo(() => new Date(), []);
  const defaultFromDate = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 30);
    return date;
  }, [today]);

  const initialFrom = defaultFromDate.toISOString().split('T')[0];
  const initialTo = today.toISOString().split('T')[0];

  // Revenue date range
  const [revenueRange, setRevenueRange] = useState<DateRange>({
    startDate: initialFrom,
    endDate: initialTo,
  });

  const {
    data: currentData,
    isLoading: isCurrentLoading,
    error: currentError,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'revenue', revenueRange.startDate, revenueRange.endDate],
    queryFn: () =>
      getAdminRevenueDashboard({
        fromDate: revenueRange.startDate,
        toDate: revenueRange.endDate,
      }),
  });

  // Chart data with gradient area
  const chartData = useMemo(() => {
    if (!currentData?.dailyRevenue) return [];

    const revenueMap = new Map<string, number>();
    currentData.dailyRevenue.forEach((d) => {
      revenueMap.set(d.date, d.amount);
    });

    // Get all dates in range and fill missing dates with 0
    const startDate = new Date(revenueRange.startDate);
    const endDate = new Date(revenueRange.endDate);
    const allDates: string[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      allDates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return allDates.map((date) => ({
      date: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      fullDate: date,
      revenue: revenueMap.get(date) ?? 0,
    }));
  }, [currentData, revenueRange]);

  // Doughnut chart data: Expert vs AI jobs
  const doughnutData = useMemo(() => {
    if (!currentData) return [];
    const expertTotal = (currentData.expertWritingJobs ?? 0) + (currentData.expertSpeakingJobs ?? 0);
    const aiTotal = (currentData.aiWritingJobs ?? 0) + (currentData.aiSpeakingJobs ?? 0);
    const total = expertTotal + aiTotal;
    if (total === 0) return [];
    return [
      { name: 'Expert', value: expertTotal, percent: ((expertTotal / total) * 100).toFixed(1) },
      { name: 'AI', value: aiTotal, percent: ((aiTotal / total) * 100).toFixed(1) },
    ];
  }, [currentData]);

  // Stacked bar chart data for scoring sessions
  const stackedBarData = useMemo(() => {
    if (!currentData?.dailyExpertJobs) return [];

    const jobMap = new Map<string, any>();
    currentData.dailyExpertJobs.forEach((d) => {
      jobMap.set(d.date, d);
    });

    // Get all dates in range and fill missing dates with 0
    const startDate = new Date(revenueRange.startDate);
    const endDate = new Date(revenueRange.endDate);
    const allDates: string[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      allDates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return allDates.map((date) => {
      const d = jobMap.get(date);
      return {
        date: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        fullDate: date,
        expWriting: d?.writingJobs ?? 0,
        expSpeaking: d?.speakingJobs ?? 0,
        aiWriting: d?.aiWritingJobs ?? 0,
        aiSpeaking: d?.aiSpeakingJobs ?? 0,
      };
    });
  }, [currentData, revenueRange]);

  const isLoading = isCurrentLoading;
  const hasError = Boolean(currentError);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <p className="mb-2 text-sm font-medium text-gray-600">{`Ngày: ${label}`}</p>
          <p className="text-lg font-semibold text-emerald-600">
            {vndFormatter.format(value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <AdminHeader title="Tổng quan" />
      <div className="space-y-6 p-6">
        {/* Date Range Filter (Global for dashboard) */}
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="w-64">
            <DateRangePicker
              value={revenueRange}
              onChange={setRevenueRange}
            />
          </div>
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Người dùng tương tác</p>
              <h4 className="text-2xl font-bold text-gray-900">{isLoading ? '-' : currentData?.totalUsers ?? '0'}</h4>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
              <UserPlus className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Đăng ký mới</p>
              <h4 className="text-2xl font-bold text-gray-900">{isLoading ? '-' : currentData?.newUsers ?? '0'}</h4>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Lượt làm đề</p>
              <h4 className="text-2xl font-bold text-gray-900">{isLoading ? '-' : currentData?.totalTests ?? '0'}</h4>
            </div>
          </div>
        </div>

        {/* Revenue Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Coins className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-800">Doanh thu</h3>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-sm text-gray-600">Doanh thu</p>
              <p className="text-xl font-bold text-emerald-600">
                {vndFormatter.format(currentData?.topupRevenue ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-gray-600">Giao dịch</p>
              <p className="text-xl font-bold text-blue-600">{currentData?.topupCount ?? 0}</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="mt-6">
            {isLoading ? (
              <SkeletonCard className="h-80" />
            ) : hasError ? (
              <p className="py-12 text-center text-red-500">Không thể tải dữ liệu dashboard</p>
            ) : chartData.length === 0 ? (
              <p className="py-12 text-center text-gray-500">Không có dữ liệu doanh thu trong khoảng thời gian này</p>
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tickFormatter={vndAxisFormatter}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                      dot={false}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Expert Work Detail Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-800">Số bài chấm</h3>
          </div>

          {isLoading ? (
            <SkeletonCard className="h-40" />
          ) : hasError ? (
            <p className="py-12 text-center text-red-500">Không thể tải dữ liệu dashboard</p>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats + Doughnut Chart */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                  <div className="rounded-lg bg-orange-50 p-4">
                    <p className="text-sm font-medium text-gray-600">Expert Writing</p>
                    <p className="text-2xl font-bold text-orange-600">{currentData?.expertWritingJobs ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-pink-50 p-4">
                    <p className="text-sm font-medium text-gray-600">Expert Speaking</p>
                    <p className="text-2xl font-bold text-pink-600">{currentData?.expertSpeakingJobs ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1"><Bot className="h-3 w-3"/> AI Writing</p>
                    <p className="text-2xl font-bold text-blue-600">{currentData?.aiWritingJobs ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 p-4">
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1"><Bot className="h-3 w-3"/> AI Speaking</p>
                    <p className="text-2xl font-bold text-indigo-600">{currentData?.aiSpeakingJobs ?? 0}</p>
                  </div>
                </div>

                {/* Doughnut Chart: Expert vs AI Revenue */}
                <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Tỉ trọng bài chấm</p>
                  {doughnutData.length > 0 ? (
                    <div className="flex w-full flex-col items-center gap-2">
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={doughnutData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={4}
                            cornerRadius={4}
                          >
                            {doughnutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : '#3b82f6'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                            formatter={(value: number, name: string, props: any) => {
                              const pct = props.payload.percent;
                              return [`${value}`, `${name} (${pct}%)`];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex gap-4 text-xs font-medium">
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-3 w-3 rounded-sm bg-orange-500" />
                          Expert {doughnutData[0]?.percent}%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-3 w-3 rounded-sm bg-blue-500" />
                          AI {doughnutData[1]?.percent}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-gray-400">Không có dữ liệu</p>
                  )}
                </div>
              </div>

              {/* Expert Jobs Chart - Stacked Column */}
              {stackedBarData.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">
                    Biểu đồ bài chấm theo ngày
                  </h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stackedBarData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                          formatter={(value: number, name: string) => {
                            const labels: Record<string, string> = {
                              expWriting: 'Expert Writing',
                              expSpeaking: 'Expert Speaking',
                              aiWriting: 'AI Writing',
                              aiSpeaking: 'AI Speaking',
                            };
                            return [`${value} bài`, labels[name] || name];
                          }}
                          labelFormatter={(label) => `Ngày: ${label}`}
                        />
                        <Legend
                          formatter={(value: string) => {
                            const labels: Record<string, string> = {
                              expWriting: 'Expert Writing',
                              expSpeaking: 'Expert Speaking',
                              aiWriting: 'AI Writing',
                              aiSpeaking: 'AI Speaking',
                            };
                            return labels[value] || value;
                          }}
                        />
                        {/* All 4 series stacked on a single stackId */}
                        <Bar dataKey="expWriting" stackId="all" name="Expert Writing" fill="#f97316" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="expSpeaking" stackId="all" name="Expert Speaking" fill="#ec4899" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="aiWriting" stackId="all" name="AI Writing" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="aiSpeaking" stackId="all" name="AI Speaking" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Date Range Info */}
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  {new Date(revenueRange.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(revenueRange.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
