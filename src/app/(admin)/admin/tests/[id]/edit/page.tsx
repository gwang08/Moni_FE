'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/components/admin/admin-header';
import { getTestDetail } from '@/lib/tests-api';
import { useQuery } from '@tanstack/react-query';
import { SkeletonPage } from '@/components/ui/skeleton';
import { TestEditBasicInfoTab } from '@/components/admin/test-edit-basic-info-tab';
import { TestEditContentTab } from '@/components/admin/test-edit-content-tab';

type Tab = 'basic' | 'content';

const TABS: { key: Tab; label: string }[] = [
  { key: 'basic', label: 'Thông tin cơ bản' },
  { key: 'content', label: 'Nội dung bài thi' },
];

export default function TestEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('basic');

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['admin', 'test', id],
    queryFn: () => getTestDetail(id),
    enabled: !!id,
    staleTime: 30_000,
  });

  return (
    <div>
      <AdminHeader title="Chỉnh sửa bài thi" />
      <div className="p-6">
        <Button variant="outline" size="sm" className="mb-6" onClick={() => router.push(`/admin/tests/${id}`)}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>

        {isLoading ? (
          <SkeletonPage />
        ) : error ? (
          <p className="text-red-500 text-center py-12">Không thể tải thông tin bài thi</p>
        ) : test && (
          <>
            <div className="flex gap-1 mb-6 border-b border-gray-200">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'basic' && <TestEditBasicInfoTab test={test} />}
            {tab === 'content' && <TestEditContentTab test={test} />}
          </>
        )}
      </div>
    </div>
  );
}
