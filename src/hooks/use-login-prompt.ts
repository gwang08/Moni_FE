'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Hook that checks auth before an action.
 * If not authenticated, opens the login prompt dialog.
 * Usage: const { showPrompt, setShowPrompt, requireAuth } = useLoginPrompt();
 */
export function useLoginPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (isAuthenticated) {
        callback();
      } else {
        setShowPrompt(true);
      }
    },
    [isAuthenticated]
  );

  return { showPrompt, setShowPrompt, requireAuth, isAuthenticated };
}
