'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Bot, Coins, FileText, TrendingUp, UserPlus, Users } from 'lucide-react';
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

  const chartData = useMemo(() => {
    if (!currentData?.dailyRevenue) return [];

    const revenueMap = new Map<string, number>();
    currentData.dailyRevenue.forEach((d) => {
      revenueMap.set(d.date, d.amount);
    });

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

  const stackedBarData = useMemo(() => {
    if (!currentData?.dailyExpertJobs) return [];

    const jobMap = new Map<string, any>();
    currentData.dailyExpertJobs.forEach((d) => {
      jobMap.set(d.date, d);
    });

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

  const totalJobs = (currentData?.expertWritingJobs ?? 0) + (currentData?.expertSpeakingJobs ?? 0) +
    (currentData?.aiWritingJobs ?? 0) + (currentData?.aiSpeakingJobs ?? 0);

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

  const dateRangeLabel = `${new Date(revenueRange.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${new Date(revenueRange.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

  return (
    <div>
      <AdminHeader title="Tổng quan" />
      <div className="space-y-6 p-6">
        {/* Date Range Filter */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Dashboard</p>
              <p className="text-xs text-gray-400">{dateRangeLabel}</p>
            </div>
          </div>
          <div className="w-64">
            <DateRangePicker
              value={revenueRange}
              onChange={setRevenueRange}
            />
          </div>
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-50 opacity-60 transition-transform group-hover:scale-110" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Người dùng tương tác</p>
                <h4 className="text-2xl font-bold text-gray-900">{isLoading ? '-' : (currentData?.totalUsers ?? 0).toLocaleString('vi-VN')}</h4>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-50 opacity-60 transition-transform group-hover:scale-110" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Đăng ký mới</p>
                <h4 className="text-2xl font-bold text-gray-900">{isLoading ? '-' : (currentData?.newUsers ?? 0).toLocaleString('vi-VN')}</h4>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-50 opacity-60 transition-transform group-hover:scale-110" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Lượt làm đề</p>
                <h4 className="text-2xl font-bold text-gray-900">{isLoading ? '-' : (currentData?.totalTests ?? 0).toLocaleString('vi-VN')}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Section */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <Coins className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Doanh thu</h3>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10" />
              <p className="text-sm font-medium text-emerald-100">Tổng doanh thu</p>
              <p className="mt-1 text-2xl font-bold">
                {vndFormatter.format(currentData?.topupRevenue ?? 0)}
              </p>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10" />
              <p className="text-sm font-medium text-blue-100">Số giao dịch</p>
              <p className="mt-1 text-2xl font-bold">{(currentData?.topupCount ?? 0).toLocaleString('vi-VN')}</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="mt-4 rounded-xl bg-gray-50/50 p-4">
            <h4 className="mb-4 text-sm font-medium text-gray-600">Biểu đồ doanh thu theo ngày</h4>
            {isLoading ? (
              <SkeletonCard className="h-80" />
            ) : hasError ? (
              <p className="py-12 text-center text-red-500">Không thể tải dữ liệu dashboard</p>
            ) : chartData.length === 0 ? (
              <p className="py-12 text-center text-gray-500">Không có dữ liệu doanh thu trong khoảng thời gian này</p>
            ) : (
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
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
                      strokeWidth={2.5}
                      fill="url(#colorRevenue)"
                      dot={false}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Scoring Section */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 shadow-lg shadow-orange-500/20">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Số bài chấm</h3>
                <p className="text-xs text-gray-400">Tổng: {totalJobs} bài</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <SkeletonCard className="h-40" />
          ) : hasError ? (
            <p className="py-12 text-center text-red-500">Không thể tải dữ liệu dashboard</p>
          ) : (
            <div className="space-y-6">
              {/* Top row: 4 metric cards in a single row */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="group relative overflow-hidden rounded-2xl border border-orange-100 p-5 transition-all hover:shadow-lg hover:shadow-orange-100/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100/30" />
                  <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-orange-200/30 transition-transform group-hover:scale-125" />
                  <div className="relative">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10">
                        <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Expert Writing</p>
                    </div>
                    <p className="text-3xl font-extrabold text-orange-600">{(currentData?.expertWritingJobs ?? 0).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-pink-100 p-5 transition-all hover:shadow-lg hover:shadow-pink-100/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100/30" />
                  <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-pink-200/30 transition-transform group-hover:scale-125" />
                  <div className="relative">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-500/10">
                        <span className="inline-block h-2 w-2 rounded-full bg-pink-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Expert Speaking</p>
                    </div>
                    <p className="text-3xl font-extrabold text-pink-600">{(currentData?.expertSpeakingJobs ?? 0).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-blue-100 p-5 transition-all hover:shadow-lg hover:shadow-blue-100/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/30" />
                  <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-blue-200/30 transition-transform group-hover:scale-125" />
                  <div className="relative">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10">
                        <Bot className="h-3 w-3 text-blue-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">AI Writing</p>
                    </div>
                    <p className="text-3xl font-extrabold text-blue-600">{(currentData?.aiWritingJobs ?? 0).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-violet-100 p-5 transition-all hover:shadow-lg hover:shadow-violet-100/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-indigo-50 to-violet-100/30" />
                  <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-violet-200/30 transition-transform group-hover:scale-125" />
                  <div className="relative">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10">
                        <Bot className="h-3 w-3 text-violet-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">AI Speaking</p>
                    </div>
                    <p className="text-3xl font-extrabold text-violet-600">{(currentData?.aiSpeakingJobs ?? 0).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>

              {/* Doughnut + Stacked Bar side by side */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Doughnut Chart */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50 to-gray-50 p-6">
                  <p className="mb-4 text-sm font-semibold text-gray-700">Tỉ trọng doanh thu credit</p>
                  {doughnutData.length > 0 ? (
                    <div className="flex w-full flex-col items-center gap-4">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <defs>
                            <linearGradient id="expertGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#f97316" />
                              <stop offset="100%" stopColor="#f59e0b" />
                            </linearGradient>
                            <linearGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={doughnutData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={78}
                            paddingAngle={4}
                            cornerRadius={6}
                          >
                            {doughnutData.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={`url(#${index === 0 ? 'expertGrad' : 'aiGrad'})`} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                            }}
                            formatter={(value: number, name: string, props: any) => {
                              const pct = props.payload.percent;
                              return [`${value}`, `${name} (${pct}%)`];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex gap-6 text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500" />
                          Expert {doughnutData[0]?.percent}%
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                          AI {doughnutData[1]?.percent}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-gray-400">Không có dữ liệu</p>
                  )}
                </div>

                {/* Stacked Bar Chart */}
                {stackedBarData.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50 to-gray-50 p-5 lg:col-span-2">
                    <h4 className="mb-4 text-sm font-semibold text-gray-700">
                      Biểu đồ bài chấm theo ngày
                    </h4>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stackedBarData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
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
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
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
                          <Bar dataKey="expWriting" stackId="all" name="Expert Writing" fill="#f97316" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="expSpeaking" stackId="all" name="Expert Speaking" fill="#ec4899" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="aiWriting" stackId="all" name="AI Writing" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="aiSpeaking" stackId="all" name="AI Speaking" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
