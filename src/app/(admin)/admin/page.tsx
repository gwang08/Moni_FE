'use client';

import { useMemo, useState } from 'react';
import { Coins, FileText, LayoutDashboard, Tag, Users } from 'lucide-react';
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
  Legend,
  ResponsiveContainer,
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

  // Revenue date range (primary)
  const [revenueRange, setRevenueRange] = useState<DateRange>({
    startDate: initialFrom,
    endDate: initialTo,
  });
  const [appliedRevenueRange, setAppliedRevenueRange] = useState<DateRange>({
    startDate: initialFrom,
    endDate: initialTo,
  });

  // Comparison date range
  const [compareRange, setCompareRange] = useState<DateRange>({
    startDate: initialFrom,
    endDate: initialTo,
  });
  const [appliedCompareRange, setAppliedCompareRange] = useState<DateRange>({
    startDate: initialFrom,
    endDate: initialTo,
  });

  const [showComparison, setShowComparison] = useState<boolean>(false);

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
    enabled: !showComparison,
  });

  const {
    data: compareData,
    isLoading: isCompareLoading,
    error: compareError,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'revenue', 'compare', appliedCompareRange.startDate, appliedCompareRange.endDate],
    queryFn: () =>
      getAdminRevenueDashboard({
        fromDate: appliedCompareRange.startDate,
        toDate: appliedCompareRange.endDate,
      }),
    enabled: showComparison,
  });

  // Combine data for chart comparison
  const chartData = useMemo(() => {
    if (!currentData?.dailyRevenue) return [];

    const revenueMap = new Map<string, number>();
    currentData.dailyRevenue.forEach((d) => {
      revenueMap.set(d.date, d.amount);
    });

    const compareMap = new Map<string, number>();
    if (showComparison && compareData?.dailyRevenue) {
      compareData.dailyRevenue.forEach((d) => {
        compareMap.set(d.date, d.amount);
      });
    }

    // Get all unique dates and sort them
    const allDates = new Set([...revenueMap.keys(), ...compareMap.keys()]);
    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map((date) => ({
      date: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      fullDate: date,
      revenue: revenueMap.get(date) ?? 0,
      compareRevenue: compareMap.get(date) ?? 0,
    }));
  }, [currentData, compareData, showComparison]);

  // Expert jobs data for the selected date range
  const expertData = showComparison ? compareData : currentData;

  const cards: StatCard[] = [
    { label: 'Tong bai thi', value: `${metaData?.tests ?? 0}`, icon: FileText, color: 'bg-blue-500' },
    { label: 'Tong tags', value: `${metaData?.tags ?? 0}`, icon: Tag, color: 'bg-green-500' },
    { label: 'Tong nguoi dung', value: `${metaData?.users ?? 0}`, icon: Users, color: 'bg-indigo-500' },
    {
      label: 'Doanh thu nap (VND)',
      value: vndFormatter.format(currentData?.topupRevenue ?? 0),
      icon: Coins,
      color: 'bg-emerald-600',
    },
    {
      label: 'Expert Writing',
      value: `${expertData?.expertWritingJobs ?? 0} job`,
      icon: FileText,
      color: 'bg-orange-500',
    },
    {
      label: 'Expert Speaking',
      value: `${expertData?.expertSpeakingJobs ?? 0} job`,
      icon: FileText,
      color: 'bg-pink-500',
    },
  ];

  const isLoading = isMetaLoading || isCurrentLoading || (showComparison && isCompareLoading);
  const hasError = metaError || currentError || (showComparison && compareError);

  return (
    <div>
      <AdminHeader title="Dashboard" />
      <div className="space-y-6 p-6">
        {/* Revenue Section - Top */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-800">Doanh thu nap tien</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showComparison ? 'An so sanh' : '+ So sanh'}
            </button>
          </div>

          {/* Date Range Filters */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div>
              <DateRangePicker
                label="Khoang doanh thu chinh"
                value={revenueRange}
                onChange={setRevenueRange}
              />
            </div>
            {showComparison && (
              <div>
                <DateRangePicker
                  label="Khoang so sanh"
                  value={compareRange}
                  onChange={setCompareRange}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setAppliedRevenueRange(revenueRange);
              if (showComparison) {
                setAppliedCompareRange(compareRange);
              }
            }}
            className="mb-4 h-10 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Xem ket qua
          </button>

          {/* Revenue Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-sm text-gray-600">Doanh thu</p>
              <p className="text-xl font-bold text-emerald-600">
                {vndFormatter.format(currentData?.topupRevenue ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-gray-600">Giao dich</p>
              <p className="text-xl font-bold text-blue-600">{currentData?.topupCount ?? 0}</p>
            </div>
            {showComparison && compareData && (
              <>
                <div className="rounded-lg bg-orange-50 p-4">
                  <p className="text-sm text-gray-600">Doanh thu (so sanh)</p>
                  <p className="text-xl font-bold text-orange-600">
                    {vndFormatter.format(compareData.topupRevenue ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <p className="text-sm text-gray-600">Giao dich (so sanh)</p>
                  <p className="text-xl font-bold text-purple-600">{compareData.topupCount ?? 0}</p>
                </div>
              </>
            )}
          </div>

          {/* Revenue Chart */}
          <div className="mt-6">
            {isLoading ? (
              <SkeletonCard className="h-80" />
            ) : chartData.length === 0 ? (
              <p className="py-12 text-center text-gray-500">Khong co du lieu doanh thu trong khoang thoi gian nay</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [vndFormatter.format(value), 'Doanh thu']}
                    labelFormatter={(label) => `Ngay: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name={showComparison ? 'Doanh thu (chinh)' : 'Doanh thu'}
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  {showComparison && (
                    <Line
                      type="monotone"
                      dataKey="compareRevenue"
                      name="Doanh thu (so sanh)"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      strokeDasharray="5 5"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
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
          <p className="py-12 text-center text-red-500">Khong the tai du lieu dashboard</p>
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
            <h3 className="text-lg font-semibold text-gray-800">Chi tiet cong viec Expert</h3>
          </div>

          {isLoading ? (
            <SkeletonCard className="h-40" />
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-orange-50 p-4">
                  <p className="text-sm text-gray-600">Writing Jobs</p>
                  <p className="text-2xl font-bold text-orange-600">{expertData?.expertWritingJobs ?? 0}</p>
                </div>
                <div className="rounded-lg bg-pink-50 p-4">
                  <p className="text-sm text-gray-600">Speaking Jobs</p>
                  <p className="text-2xl font-bold text-pink-600">{expertData?.expertSpeakingJobs ?? 0}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">Tong Jobs</p>
                  <p className="text-2xl font-bold text-blue-600">{expertData?.totalExpertJobs ?? 0}</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <p className="text-sm text-gray-600">Tong Credits</p>
                  <p className="text-2xl font-bold text-purple-600">{expertData?.totalExpertCredits ?? 0}</p>
                </div>
              </div>

              {/* Expert Jobs Chart */}
              {expertData?.dailyExpertJobs && expertData.dailyExpertJobs.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">
                    Bieu do cong viec Expert theo ngay
                  </h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={expertData.dailyExpertJobs.map(d => ({
                      date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                      writingJobs: d.writingJobs,
                      speakingJobs: d.speakingJobs,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
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
                        labelFormatter={(label) => `Ngay: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="writingJobs" name="Writing Jobs" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="speakingJobs" name="Speaking Jobs" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Date Range Info */}
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Khoang thoi gian: </span>
                  {new Date(appliedRevenueRange.startDate).toLocaleDateString('vi-VN')} - {new Date(appliedRevenueRange.endDate).toLocaleDateString('vi-VN')}
                  {showComparison && (
                    <>
                      <br />
                      <span className="font-medium">So sanh voi: </span>
                      {new Date(appliedCompareRange.startDate).toLocaleDateString('vi-VN')} - {new Date(appliedCompareRange.endDate).toLocaleDateString('vi-VN')}
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
