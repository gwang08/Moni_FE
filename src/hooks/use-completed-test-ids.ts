'use client';

import { useQuery } from '@tanstack/react-query';
import { getAttemptHistory } from '@/lib/practice-api';
import { getWritingSubmissions, getSpeakingSubmissions } from '@/lib/ai-api';
import { getMySessions } from '@/lib/expert-api';

/**
 * Lấy tập hợp testId user đã hoàn thành — server-side source of truth.
 * Hợp nhất 4 nguồn:
 * - Reading/Listening practice attempts
 * - Writing AI submissions
 * - Speaking AI submissions
 * - Speaking sessions chấm bởi expert (status COMPLETED) — trước đây bị thiếu
 *   nên bài Speaking đã chấm xong qua expert không hiện ở tab "Bài đã làm".
 *
 * Trước đây chỉ dựa vào localStorage `practice-progress` → đổi máy/trình duyệt là mất.
 * Giờ backend là nguồn chính, localStorage chỉ giữ làm cache feedback tức thì sau submit.
 */
export function useCompletedTestIds() {
  return useQuery({
    queryKey: ['completed-test-ids'],
    queryFn: async (): Promise<Set<string>> => {
      const [attempts, writing, speaking, sessions] = await Promise.all([
        getAttemptHistory().catch(() => []),
        getWritingSubmissions().catch(() => []),
        getSpeakingSubmissions().catch(() => []),
        getMySessions().catch(() => []),
      ]);
      const ids = new Set<string>();
      for (const a of attempts) if (a.testId) ids.add(String(a.testId));
      for (const w of writing) if (w.testId) ids.add(String(w.testId));
      for (const s of speaking) if (s.test?.id) ids.add(String(s.test.id));
      for (const s of sessions) {
        if (s.status === 'COMPLETED' && s.skill?.toUpperCase() === 'SPEAKING' && s.testId) {
          ids.add(String(s.testId));
        }
      }
      return ids;
    },
    staleTime: 60_000,
  });
}
