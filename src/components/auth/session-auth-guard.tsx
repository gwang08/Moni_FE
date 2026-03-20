'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Clears auth on new browser session when user logged in without "Remember me".
 * Uses sessionStorage marker: if 'auth-session-only' is in localStorage
 * but 'auth-session-active' is NOT in sessionStorage → new session → clear auth.
 */
export function SessionAuthGuard() {
  useEffect(() => {
    const sessionOnly = localStorage.getItem('auth-session-only');
    const sessionActive = sessionStorage.getItem('auth-session-active');

    if (sessionOnly && !sessionActive) {
      useAuthStore.getState().clearAuth();
      localStorage.removeItem('auth-session-only');
    }

    sessionStorage.setItem('auth-session-active', '1');
  }, []);

  return null;
}
