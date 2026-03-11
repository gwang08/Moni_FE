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
    staleTime: 5 * 60 * 1000, // 5 min — test content rarely changes
    gcTime: 10 * 60 * 1000,   // keep in cache 10 min
  });

  return {
    testDetail: data ?? null,
    loading: isLoading,
    error: error ? 'Không thể tải bài tập. Vui lòng thử lại.' : null,
  };
}
