'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Shuffle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { FullTestAutoDialog } from '@/components/admin/full-test-auto-dialog';
import {
  ADMIN_TEST_SKILL_BADGES,
  ADMIN_TEST_STATUS_BADGES,
  ADMIN_TEST_STATUS_LABELS,
  ADMIN_TEST_TYPE_BADGES,
  ADMIN_TEST_TYPE_LABELS,
} from '@/components/admin/admin-test-badges';
import { getFullTests } from '@/lib/admin-full-test-api';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

const SKILL_FILTERS = ['ALL', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'] as const;
const SKILL_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

export default function AdminFullTestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [autoOpen, setAutoOpen] = useState(false);
  const [skillFilter, setSkillFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: fullTests = [], isLoading } = useQuery({
    queryKey: ['full-tests'],
    queryFn: getFullTests,
    staleTime: 30_000,
  });

  const filteredFullTests = useMemo(() => {
    let filtered = fullTests;

    // Filter by skill
    if (skillFilter !== 'ALL') {
      filtered = filtered.filter(test => test.skill === skillFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(test =>
        test.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [fullTests, skillFilter, searchQuery]);

  const handleRowClick = (id: number) => {
    router.push(`/admin/full-tests/${id}`);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader title="Quản lý Full Test" />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filteredFullTests.length} full test
            {skillFilter !== 'ALL' ? ` (${SKILL_LABELS[skillFilter]})` : ''}
            {searchQuery ? ` (Tìm kiếm: "${searchQuery}")` : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAutoOpen(true)}>
              <Shuffle className="h-4 w-4 mr-2" />
              Tạo ngẫu nhiên
            </Button>
            <Button onClick={() => router.push('/admin/full-tests/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo Full Test
            </Button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {SKILL_FILTERS.map(skill => (
              <button
                key={skill}
                onClick={() => setSkillFilter(skill)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  skillFilter === skill
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {SKILL_LABELS[skill]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <SkeletonTable />
        ) : filteredFullTests.length === 0 ? (
          <div className="text-center py-16 text-gray-400 border rounded-lg">
            {searchQuery 
              ? `Không tìm thấy Full Test nào với từ khóa "${searchQuery}".`
              : 'Chưa có Full Test nào theo bộ lọc hiện tại.'}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[60%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tên đề</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kỹ năng</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Loại</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFullTests.map((test) => (
                  <tr
                    key={test.id}
                    className="hover:bg-gray-50 transition-colors"
                    onClick={() => handleRowClick(test.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="flex-1 min-w-0 truncate" title={test.title}>
                          {test.title}
                        </span>
                        {test.status === 'HIDDEN' && (
                          <Badge
                            className={ADMIN_TEST_STATUS_BADGES[test.status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}
                          >
                            {ADMIN_TEST_STATUS_LABELS[test.status] ?? test.status}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={ADMIN_TEST_SKILL_BADGES[test.skill] ?? 'bg-gray-100 text-gray-700'}>
                        {test.skill}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {test.testType ? (
                        <Badge className={ADMIN_TEST_TYPE_BADGES[test.testType] ?? 'bg-gray-100 text-gray-700'}>
                          {ADMIN_TEST_TYPE_LABELS[test.testType] ?? test.testType}
                        </Badge>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FullTestAutoDialog open={autoOpen} onClose={() => setAutoOpen(false)} />
    </div>
  );
}
