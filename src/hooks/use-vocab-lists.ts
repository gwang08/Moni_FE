import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyLists, type VocabLookupResult } from '@/lib/vocab-api';
import type { VocabCollection } from '@/types/vocab.types';

/**
 * React Query hook to fetch and cache user's vocab lists.
 * Prevents redundant API calls when looking up words.
 */
export function useVocabLists() {
  return useQuery<VocabCollection[]>({
    queryKey: ['vocab', 'lists'],
    queryFn: getMyLists,
    staleTime: 5 * 60 * 1000, // 5 minutes - lists don't change often
    gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to manually invalidate vocab list cache when needed
 * (e.g., after creating or deleting a list)
 */
export function useInvalidateVocabLists() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['vocab', 'lists'] });
  };
}

/**
 * Legacy hook-style wrapper for backward compatibility.
 * Returns the same API shape as before but uses cache internally.
 * 
 * @deprecated Use `useVocabLists()` directly instead
 */
export function useVocabListsLegacy() {
  const [vocabLists, setVocabLists] = useState<VocabCollection[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const { data, isLoading, refetch } = useVocabLists();

  useEffect(() => {
    if (data) {
      setVocabLists(data);
      setLoadingLists(false);
    } else if (isLoading) {
      setLoadingLists(true);
    }
  }, [data, isLoading]);

  return {
    vocabLists,
    loadingLists,
    refetch,
  };
}
