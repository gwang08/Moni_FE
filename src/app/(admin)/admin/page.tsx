'use client';

import { useMemo, useState } from 'react';
import { Coins, FileText, Tag, Users } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { getTests } from '@/lib/tests-api';
import { getAdminRevenueDashboard, getTags, getUsers } from '@/lib/admin-api';
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
} from 'recharts';

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

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
  const [appliedRevenueRange, setAppliedRevenueRange] = useState<DateRange>({
    startDate: initialFrom,
    endDate: initialTo,
  });

  const { data: metaData, isLoading: isMetaLoading, error: metaError } = useQuery({
    queryKey: ['admin', 'dashboard', 'meta'],
    queryFn: async () => {
      const [testsData, tagsData, usersData] = await Promise.all([getTests(1, 1), getTags(), getUsers()]);
      return {
        tests: testsData.totalElements,
        tags: tagsData.length,
        users: usersData.length,
      };
    },
  });

  const {
    data: currentData,
    isLoading: isCurrentLoading,
    error: currentError,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'revenue', appliedRevenueRange.startDate, appliedRevenueRange.endDate],
    queryFn: () =>
      getAdminRevenueDashboard({
        fromDate: appliedRevenueRange.startDate,
        toDate: appliedRevenueRange.endDate,
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
    const startDate = new Date(appliedRevenueRange.startDate);
    const endDate = new Date(appliedRevenueRange.endDate);
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
  }, [currentData, appliedRevenueRange]);

  const cards: StatCard[] = [
    { label: 'Tổng bài thi', value: `${metaData?.tests ?? 0}`, icon: FileText, color: 'bg-blue-500' },
    { label: 'Tổng tags', value: `${metaData?.tags ?? 0}`, icon: Tag, color: 'bg-green-500' },
    { label: 'Tổng người dùng', value: `${metaData?.users ?? 0}`, icon: Users, color: 'bg-indigo-500' },
    {
      label: 'Doanh thu nạp (VND)',
      value: vndFormatter.format(currentData?.topupRevenue ?? 0),
      icon: Coins,
      color: 'bg-emerald-600',
    },
    {
      label: 'Expert Writing',
      value: `${currentData?.expertWritingJobs ?? 0} job`,
      icon: FileText,
      color: 'bg-orange-500',
    },
    {
      label: 'Expert Speaking',
      value: `${currentData?.expertSpeakingJobs ?? 0} job`,
      icon: FileText,
      color: 'bg-pink-500',
    },
  ];

  const isLoading = isMetaLoading || isCurrentLoading;
  const hasError = metaError || currentError;

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
      <AdminHeader title="Dashboard" />
      <div className="space-y-6 p-6">
        {/* Revenue Section - Top */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-800">Doanh thu nạp tiền</h3>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="mb-6 max-w-md">
            <DateRangePicker
              label="Khoảng thời gian"
              value={revenueRange}
              onChange={setRevenueRange}
            />
          </div>

          <button
            type="button"
            onClick={() => setAppliedRevenueRange(revenueRange)}
            className="mb-4 h-10 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Xem kết quả
          </button>

          {/* Revenue Stats */}
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
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
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

        {/* Stat Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
          </div>
        ) : hasError ? (
          <p className="py-12 text-center text-red-500">Không thể tải dữ liệu dashboard</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className={`${color} rounded-lg p-3 text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{value}</p>
                  <p className="mt-1 text-sm text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expert Work Detail Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-800">Chi tiết công việc Expert</h3>
          </div>

          {isLoading ? (
            <SkeletonCard className="h-40" />
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-orange-50 p-4">
                  <p className="text-sm text-gray-600">Writing Jobs</p>
                  <p className="text-2xl font-bold text-orange-600">{currentData?.expertWritingJobs ?? 0}</p>
                </div>
                <div className="rounded-lg bg-pink-50 p-4">
                  <p className="text-sm text-gray-600">Speaking Jobs</p>
                  <p className="text-2xl font-bold text-pink-600">{currentData?.expertSpeakingJobs ?? 0}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">Tổng Jobs</p>
                  <p className="text-2xl font-bold text-blue-600">{currentData?.totalExpertJobs ?? 0}</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <p className="text-sm text-gray-600">Tổng Credits</p>
                  <p className="text-2xl font-bold text-purple-600">{currentData?.totalExpertCredits ?? 0}</p>
                </div>
              </div>

              {/* Expert Jobs Chart */}
              {currentData?.dailyExpertJobs && currentData.dailyExpertJobs.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">
                    Biểu đồ công việc Expert theo ngày
                  </h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentData.dailyExpertJobs.map(d => ({
                        date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                        writingJobs: d.writingJobs,
                        speakingJobs: d.speakingJobs,
                      }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                            const label = name === 'writingJobs' ? 'Writing' : 'Speaking';
                            return [`${value} job`, label];
                          }}
                          labelFormatter={(label) => `Ngày: ${label}`}
                        />
                        <Bar dataKey="writingJobs" name="Writing Jobs" fill="#f97316" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="speakingJobs" name="Speaking Jobs" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Date Range Info */}
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Khoảng thời gian: </span>
                  {new Date(appliedRevenueRange.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(appliedRevenueRange.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
