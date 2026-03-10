'use client';

import { useQuery } from '@tanstack/react-query';
import { getPublicTestDetail } from '@/lib/tests-api';
import type { TestDetailResponse } from '@/types/test.types';

interface UseTestDetailResult {
  testDetail: TestDetailResponse | null;
  loading: boolean;
  error: string | null;
}

export function useTestDetail(id: string): UseTestDetailResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['test', 'detail', id],
    queryFn: () => getPublicTestDetail(id),
    enabled: !!id,
    staleTime: 30_000,
  });

  return {
    testDetail: data ?? null,
    loading: isLoading,
    error: error ? 'Không thể tải bài tập. Vui lòng thử lại.' : null,
  };
}
