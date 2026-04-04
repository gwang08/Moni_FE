'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPublishedTests, getTests } from '@/lib/tests-api';
import { getRoleFromToken } from '@/lib/jwt-utils';
import { testResponseToExercise } from '@/lib/skill-utils';
import { useAuthStore } from '@/store/auth-store';
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

export function usePracticeExercises(activeSkill: Skill | null, activePassage: number | null = null, activeMode: string = 'PRACTICE'): UsePracticeExercisesResult {
  const token = useAuthStore((state) => state.token);
  const storedRole = useAuthStore((state) => state.user?.role);
  const role = token ? getRoleFromToken(token) ?? storedRole : storedRole;
  const [pagination, setPagination] = useState<{
    page: number;
    skill: Skill | null;
    passage: number | null;
    mode: string;
  }>({
    page: 1,
    skill: activeSkill,
    passage: activePassage,
    mode: activeMode,
  });

  const page = pagination.skill === activeSkill && pagination.passage === activePassage && pagination.mode === activeMode ? pagination.page : 1;
  const setPage = (nextPage: number) => {
    setPagination({
      page: nextPage,
      skill: activeSkill,
      passage: activePassage,
      mode: activeMode,
    });
  };
  // Always use public endpoint for /practice to get all tests including FULL_TEST
  // Admin endpoint excludes FULL_TEST tests, which causes missing data
  const useAdminSource = false;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['practice', 'tests', useAdminSource ? 'admin' : 'public', page, activeSkill, activePassage, activeMode],
    queryFn: () =>
      useAdminSource
        ? getTests(page, 12, activeSkill ?? undefined, undefined, activePassage)
        : getPublishedTests(page, 12, activeSkill ?? undefined, activePassage),
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
