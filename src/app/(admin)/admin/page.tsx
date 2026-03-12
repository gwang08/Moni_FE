'use client';

import type { ElementType } from 'react';
import { LayoutDashboard, FileText, Tag, Users } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { getTests } from '@/lib/tests-api';
import { getTags, getUsers } from '@/lib/admin-api';
import { AdminHeader } from '@/components/admin/admin-header';

interface StatCard {
  label: string;
  value: number;
  icon: ElementType;
  color: string;
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: async () => {
      const [testsData, tagsData, usersData] = await Promise.all([
        getTests(1, 1),
        getTags(),
        getUsers(),
      ]);
      return {
        tests: testsData.totalElements,
        tags: tagsData.length,
        users: usersData.length,
      };
    },
  });

  const cards: StatCard[] = [
    { label: 'Tổng bài thi', value: stats?.tests ?? 0, icon: FileText, color: 'bg-blue-500' },
    { label: 'Tổng tags', value: stats?.tags ?? 0, icon: Tag, color: 'bg-green-500' },
    { label: 'Tổng người dùng', value: stats?.users ?? 0, icon: Users, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <AdminHeader title="Dashboard" />
      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center py-12">Không thể tải dữ liệu thống kê</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
                <div className={`${color} text-white p-3 rounded-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <LayoutDashboard className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Chào mừng đến Admin Panel</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Sử dụng thanh điều hướng bên trái để quản lý bài thi, tags, người dùng và media.
          </p>
        </div>
      </div>
    </div>
  );
}
