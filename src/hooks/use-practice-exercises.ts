'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTests } from '@/lib/tests-api';
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
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const retry = useCallback(() => setFetchTrigger((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getTests(page, 12, activeSkill ?? undefined)
      .then((data) => {
        if (cancelled) return;
        setExercises(data.content.map(testResponseToExercise));
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Không thể tải danh sách bài tập. Vui lòng thử lại.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeSkill, page, fetchTrigger]);

  // Reset to page 1 when skill filter changes
  useEffect(() => {
    setPage(1);
  }, [activeSkill]);

  return { exercises, loading, error, page, totalPages, setPage, retry };
}
