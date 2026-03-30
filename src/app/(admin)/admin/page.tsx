'use client';

import { useMemo, useState, type ElementType } from 'react';
import { CalendarDays, Coins, FileText, LayoutDashboard, Tag, Users } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { getTests } from '@/lib/tests-api';
import { getAdminRevenueDashboard, getTags, getUsers } from '@/lib/admin-api';
import { AdminHeader } from '@/components/admin/admin-header';

interface StatCard {
  label: string;
  value: string;
  icon: ElementType;
  color: string;
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  const initialFrom = formatDateInput(defaultFromDate);
  const initialTo = formatDateInput(today);

  const [topupFromDate, setTopupFromDate] = useState<string>(initialFrom);
  const [topupToDate, setTopupToDate] = useState<string>(initialTo);
  const [appliedTopupFromDate, setAppliedTopupFromDate] = useState<string>(initialFrom);
  const [appliedTopupToDate, setAppliedTopupToDate] = useState<string>(initialTo);

  const [expertFromDate, setExpertFromDate] = useState<string>(initialFrom);
  const [expertToDate, setExpertToDate] = useState<string>(initialTo);
  const [appliedExpertFromDate, setAppliedExpertFromDate] = useState<string>(initialFrom);
  const [appliedExpertToDate, setAppliedExpertToDate] = useState<string>(initialTo);

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
    data: topupData,
    isLoading: isTopupLoading,
    error: topupError,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'topup', appliedTopupFromDate, appliedTopupToDate],
    queryFn: () =>
      getAdminRevenueDashboard({
        fromDate: appliedTopupFromDate,
        toDate: appliedTopupToDate,
      }),
  });

  const {
    data: expertData,
    isLoading: isExpertLoading,
    error: expertError,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'expert', appliedExpertFromDate, appliedExpertToDate],
    queryFn: () =>
      getAdminRevenueDashboard({
        fromDate: appliedExpertFromDate,
        toDate: appliedExpertToDate,
      }),
  });

  const cards: StatCard[] = [
    { label: 'Tong bai thi', value: `${metaData?.tests ?? 0}`, icon: FileText, color: 'bg-blue-500' },
    { label: 'Tong tags', value: `${metaData?.tags ?? 0}`, icon: Tag, color: 'bg-green-500' },
    { label: 'Tong nguoi dung', value: `${metaData?.users ?? 0}`, icon: Users, color: 'bg-indigo-500' },
    {
      label: 'Doanh thu nap (VND)',
      value: vndFormatter.format(topupData?.topupRevenue ?? 0),
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

  const isLoading = isMetaLoading || isTopupLoading || isExpertLoading;
  const hasError = metaError || topupError || expertError;

  return (
    <div>
      <AdminHeader title="Dashboard" />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-gray-700">
              <CalendarDays className="h-4 w-4" />
              <p className="text-sm font-semibold">Loc thoi gian doanh thu nap</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Tu ngay</span>
                <input
                  type="date"
                  value={topupFromDate}
                  onChange={(event) => setTopupFromDate(event.target.value)}
                  className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Den ngay</span>
                <input
                  type="date"
                  value={topupToDate}
                  onChange={(event) => setTopupToDate(event.target.value)}
                  className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setAppliedTopupFromDate(topupFromDate);
                  setAppliedTopupToDate(topupToDate);
                }}
                className="h-10 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Tim kiem
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-gray-700">
              <CalendarDays className="h-4 w-4" />
              <p className="text-sm font-semibold">Loc thoi gian cong viec expert</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Tu ngay</span>
                <input
                  type="date"
                  value={expertFromDate}
                  onChange={(event) => setExpertFromDate(event.target.value)}
                  className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Den ngay</span>
                <input
                  type="date"
                  value={expertToDate}
                  onChange={(event) => setExpertToDate(event.target.value)}
                  className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setAppliedExpertFromDate(expertFromDate);
                  setAppliedExpertToDate(expertToDate);
                }}
                className="h-10 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Tim kiem
              </button>
            </div>
          </div>
        </div>

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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-800">Muc doanh thu nap</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Giao dich nap tien thanh cong: {topupData?.topupCount ?? 0}</p>
              <p>Doanh thu nap: {vndFormatter.format(topupData?.topupRevenue ?? 0)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">Muc cong viec expert</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Tong credit expert da dung: {expertData?.totalExpertCredits ?? 0}</p>
              <p>Tong job expert: {expertData?.totalExpertJobs ?? 0}</p>
              <p>Writing jobs: {expertData?.expertWritingJobs ?? 0}</p>
              <p>Speaking jobs: {expertData?.expertSpeakingJobs ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
