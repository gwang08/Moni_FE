'use client';

import { useState, useEffect } from 'react';
import { getTestDetail } from '@/lib/tests-api';
import type { TestDetailResponse } from '@/types/test.types';

interface UseTestDetailResult {
  testDetail: TestDetailResponse | null;
  loading: boolean;
  error: string | null;
}

export function useTestDetail(id: string): UseTestDetailResult {
  const [testDetail, setTestDetail] = useState<TestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getTestDetail(id)
      .then((data) => {
        if (!cancelled) setTestDetail(data);
      })
      .catch(() => {
        if (!cancelled) setError('Không thể tải bài tập. Vui lòng thử lại.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  return { testDetail, loading, error };
}
