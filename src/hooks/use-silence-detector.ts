import { useRef, useEffect, useCallback } from 'react';

/**
 * Detects user silence during speaking.
 * If `transcript` doesn't change for `silenceMs` while `isActive` is true,
 * calls `onSilence`.
 */
export function useSilenceDetector(
  transcript: string,
  isActive: boolean,
  onSilence: () => void,
  silenceMs = 6000, // 6 seconds default
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSilenceRef = useRef(onSilence);

  useEffect(() => {
    onSilenceRef.current = onSilence;
  }, [onSilence]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      clearTimer();
      return;
    }

    // Reset timer every time transcript changes
    clearTimer();
    timerRef.current = setTimeout(() => {
      console.log('[SilenceDetector] Silence detected, auto-submitting');
      onSilenceRef.current();
    }, silenceMs);

    return () => clearTimer();
  }, [transcript, isActive, silenceMs, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);
}
