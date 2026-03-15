import { useEffect, useState, useRef } from 'react';
import { getAttemptHistory } from '@/lib/practice-api';
import type { AttemptHistory } from '@/lib/practice-api';

// Shared cache so multiple components don't re-fetch
let cachedData: AttemptHistory[] | null = null;
let fetchPromise: Promise<AttemptHistory[]> | null = null;

export function useAttemptHistory() {
  const [attempts, setAttempts] = useState<AttemptHistory[]>(cachedData ?? []);
  const [loading, setLoading] = useState(cachedData === null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    if (cachedData) {
      setAttempts(cachedData);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = getAttemptHistory().finally(() => {
        fetchPromise = null;
      });
    }

    fetchPromise.then((data) => {
      cachedData = data;
      setAttempts(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { attempts, loading };
}

/** Call this to invalidate the cache (e.g. after new attempt submitted) */
export function invalidateAttemptCache() {
  cachedData = null;
  fetchPromise = null;
}
