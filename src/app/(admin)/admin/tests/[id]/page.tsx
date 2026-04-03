'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AdminHeader } from '@/components/admin/admin-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { getTestDetail } from '@/lib/tests-api';
import { TestEditBasicInfoTab } from '@/components/admin/test-edit-basic-info-tab';
import { TestEditContentTab } from '@/components/admin/test-edit-content-tab';

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['admin', 'test', id],
    queryFn: () => getTestDetail(id),
    enabled: !!id,
    staleTime: 30_000,
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AdminHeader title="Chi tiết bài thi" />
      <div className="flex-1 p-6">
        {isLoading ? (
          <SkeletonPage />
        ) : error ? (
          <p className="py-12 text-center text-red-500">Không thể tải thông tin bài thi</p>
        ) : test ? (
          <div className="space-y-6">
            <TestEditBasicInfoTab test={test} onSaved={() => {}} />
            <TestEditContentTab test={test} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
