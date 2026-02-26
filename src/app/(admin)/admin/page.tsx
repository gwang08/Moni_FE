'use client';

import { useEffect, useState } from 'react';
import type { ElementType } from 'react';
import { LayoutDashboard, FileText, Tag, Users } from 'lucide-react';
import { Loader2 } from 'lucide-react';
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
  const [stats, setStats] = useState({ tests: 0, tags: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const [testsData, tagsData, usersData] = await Promise.all([
          getTests(1, 1),
          getTags(),
          getUsers(),
        ]);
        setStats({
          tests: testsData.totalElements,
          tags: tagsData.length,
          users: usersData.length,
        });
      } catch {
        setError('Không thể tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards: StatCard[] = [
    { label: 'Tổng bài thi', value: stats.tests, icon: FileText, color: 'bg-blue-500' },
    { label: 'Tổng tags', value: stats.tags, icon: Tag, color: 'bg-green-500' },
    { label: 'Tổng người dùng', value: stats.users, icon: Users, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <AdminHeader title="Dashboard" />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center py-12">{error}</p>
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
