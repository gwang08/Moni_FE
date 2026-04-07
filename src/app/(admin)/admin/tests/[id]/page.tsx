'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { AdminHeader } from '@/components/admin/admin-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getTestDetail } from '@/lib/tests-api';
import { TestEditBasicInfoTab, type TestEditBasicInfoHandle } from '@/components/admin/test-edit-basic-info-tab';
import { TestEditContentTab, type TestEditContentHandle } from '@/components/admin/test-edit-content-tab';
import { toast } from 'sonner';

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const basicInfoRef = useRef<TestEditBasicInfoHandle>(null);
  const contentRef = useRef<TestEditContentHandle>(null);
  const [saving, setSaving] = useState(false);

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['admin', 'test', id],
    queryFn: () => getTestDetail(id),
    enabled: !!id,
    staleTime: 30_000,
  });

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if (!basicInfoRef.current) {
        toast.error('Không thể lưu thông tin cơ bản');
        return;
      }

      const basicSaved = await basicInfoRef.current.save();
      if (!basicSaved) return;

      const contentSaved = await contentRef.current?.saveAll();
      if (contentSaved === false) return;

      toast.success('Đã lưu toàn bộ thay đổi');
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AdminHeader title="Chi tiết bài thi" />
      <div className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <SkeletonPage />
        ) : error ? (
          <p className="py-12 text-center text-red-500">Không thể tải thông tin bài thi</p>
        ) : test ? (
          <div className="space-y-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin/tests')}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </button>
              <Button onClick={handleSaveAll} disabled={saving} size="sm" className="bg-green-600 hover:bg-green-700">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>

            <div>
              <TestEditBasicInfoTab ref={basicInfoRef} test={test} />
            </div>

            <div>
              <TestEditContentTab
                ref={contentRef}
                test={test}
                onBeforeSaveBasicInfo={async () => {
                  if (!basicInfoRef.current) return true;
                  return basicInfoRef.current.save();
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
