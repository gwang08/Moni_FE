'use client';

import { useRef, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { AdminHeader } from '@/components/admin/admin-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getTestDetail } from '@/lib/tests-api';
import { TestEditBasicInfoTab, type TestEditBasicInfoHandle } from '@/components/admin/test-edit-basic-info-tab';
import { TestEditContentTab } from '@/components/admin/test-edit-content-tab';
import { toast } from 'sonner';

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const basicInfoRef = useRef<TestEditBasicInfoHandle>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [basicInfoCollapsed, setBasicInfoCollapsed] = useState(false);

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
      const success = await basicInfoRef.current.save();
      if (success) {
        toast.success('Đã lưu toàn bộ thay đổi');
      }
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  // Auto-collapse basic info when content section is visible
  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setBasicInfoCollapsed(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AdminHeader title="Chi tiết bài thi" />
      <div className="flex-1 p-4">
        {isLoading ? (
          <SkeletonPage />
        ) : error ? (
          <p className="py-12 text-center text-red-500">Không thể tải thông tin bài thi</p>
        ) : test ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{test.title}</h2>
                <p className="text-xs text-gray-500">
                  {test.skill} {test.section ? `— Phần ${test.section}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/tests`)}
                  size="sm"
                >
                  Hủy
                </Button>
                <Button onClick={handleSaveAll} disabled={saving} size="sm">
                  <Save className="h-3.5 w-3.5" />
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            </div>

            {/* Basic Info - auto collapses when content is visible */}
            <div className={`transition-all duration-300 ${basicInfoCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-[2000px] opacity-100'}`}>
              <TestEditBasicInfoTab ref={basicInfoRef} test={test} />
            </div>

            {/* Content section */}
            <div ref={contentRef}>
              <TestEditContentTab
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
