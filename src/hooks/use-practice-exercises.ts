'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPublishedTests } from '@/lib/tests-api';
import { testResponseToExercise } from '@/lib/skill-utils';
import type { Exercise, Skill } from '@/types/practice.types';

interface UsePracticeExercisesResult {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  retry: () => void;
}

export function usePracticeExercises(activeSkill: Skill | null): UsePracticeExercisesResult {
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['practice', 'tests', page, activeSkill],
    queryFn: () => getPublishedTests(page, 12, activeSkill ?? undefined),
    staleTime: 5 * 60 * 1000, // 5 min — test list rarely changes
    gcTime: 10 * 60 * 1000,
  });

  return {
    exercises: data?.content.map(testResponseToExercise) ?? [],
    loading: isLoading,
    error: error ? 'Không thể tải danh sách bài tập. Vui lòng thử lại.' : null,
    page,
    totalPages: data?.totalPages ?? 1,
    setPage,
    retry: () => { refetch(); },
  };
}
