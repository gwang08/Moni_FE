'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Shuffle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/components/admin/admin-header';
import { FullTestAutoDialog } from '@/components/admin/full-test-auto-dialog';
import { getFullTests } from '@/lib/admin-full-test-api';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

const SKILL_BADGE: Record<string, string> = {
  READING: 'bg-blue-100 text-blue-800 border-blue-200',
  LISTENING: 'bg-purple-100 text-purple-800 border-purple-200',
  SPEAKING: 'bg-orange-100 text-orange-800 border-orange-200',
  WRITING: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PUBLISHED: 'bg-green-100 text-green-800 border-green-200',
  HIDDEN: 'bg-gray-100 text-gray-600 border-gray-200',
};

const TEST_TYPE_BADGE: Record<string, string> = {
  ACADEMIC: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  GENERAL_TRAINING: 'bg-teal-100 text-teal-800 border-teal-200',
  BOTH: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  FULL_TEST: 'bg-violet-100 text-violet-800 border-violet-200',
  PRACTICE: 'bg-slate-100 text-slate-800 border-slate-200',
};

const TEST_TYPE_LABEL: Record<string, string> = {
  ACADEMIC: 'Academic',
  GENERAL_TRAINING: 'General',
  BOTH: 'Both',
  FULL_TEST: 'Full Test',
  PRACTICE: 'Practice',
};

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
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tên đề</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kỹ năng</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Loại</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFullTests.map((test) => (
                  <tr
                    key={test.id}
                    className="hover:bg-gray-50 transition-colors"
                    onClick={() => handleRowClick(test.id)}
                  >
                    <td 
                      className="px-4 py-3 font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {test.title}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={SKILL_BADGE[test.skill] ?? 'bg-gray-100 text-gray-700'}>
                        {test.skill}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={TEST_TYPE_BADGE[test.testType ?? 'PRACTICE'] ?? 'bg-gray-100 text-gray-700'}>
                        {TEST_TYPE_LABEL[test.testType ?? 'PRACTICE'] ?? test.testType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_BADGE[test.status] ?? 'bg-gray-100 text-gray-700'}>
                        {test.status}
                      </Badge>
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
