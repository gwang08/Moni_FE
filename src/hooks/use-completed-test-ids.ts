'use client';

import { useQuery } from '@tanstack/react-query';
import { getAttemptHistory } from '@/lib/practice-api';
import { getWritingSubmissions, getSpeakingSubmissions } from '@/lib/ai-api';

/**
 * Lấy tập hợp testId user đã hoàn thành — server-side source of truth.
 * Hợp nhất 3 nguồn: practice attempts (reading/listening) + writing submissions + speaking submissions.
 *
 * Trước đây chỉ dựa vào localStorage `practice-progress` → đổi máy/trình duyệt là mất.
 * Giờ backend là nguồn chính, localStorage chỉ giữ làm cache feedback tức thì sau submit.
 */
export function useCompletedTestIds() {
  return useQuery({
    queryKey: ['completed-test-ids'],
    queryFn: async (): Promise<Set<string>> => {
      const [attempts, writing, speaking] = await Promise.all([
        getAttemptHistory().catch(() => []),
        getWritingSubmissions().catch(() => []),
        getSpeakingSubmissions().catch(() => []),
      ]);
      const ids = new Set<string>();
      for (const a of attempts) if (a.testId) ids.add(String(a.testId));
      for (const w of writing) if (w.testId) ids.add(String(w.testId));
      for (const s of speaking) if (s.test?.id) ids.add(String(s.test.id));
      return ids;
    },
    staleTime: 60_000,
  });
}
