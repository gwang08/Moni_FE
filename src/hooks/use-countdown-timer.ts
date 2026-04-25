import { useEffect, useRef, useState } from 'react';

/**
 * Countdown timer for exam mode.
 * @param durationMinutes - total time in minutes (from test.duration)
 * @param stop - stop counting when true (submitted)
 * @param onTimeUp - callback when time reaches 0
 * @param initialRemainingSeconds - override initial remaining (for resume from server)
 * @returns remaining seconds + formatted string + whether time is up
 */
export function useCountdownTimer(
  durationMinutes: number,
  stop: boolean,
  onTimeUp?: () => void,
  initialRemainingSeconds?: number,
) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const initializedRef = useRef(false);

  // 1. Initialize with server value (resume/exam start)
  useEffect(() => {
    if (initialRemainingSeconds != null) {
      setRemaining(initialRemainingSeconds);
      setTotalSeconds(initialRemainingSeconds);
      initializedRef.current = true;
    }
  }, [initialRemainingSeconds]);

  // 2. Initialize with durationMinutes fallback (practice mode or first-time start if server value not yet here)
  useEffect(() => {
    // Only set if not already initialized by server and no server value is provided yet
    if (!initializedRef.current && initialRemainingSeconds == null && durationMinutes > 0) {
      const seconds = durationMinutes * 60;
      setRemaining(seconds);
      setTotalSeconds(seconds);
    }
  }, [durationMinutes, initialRemainingSeconds]);

  useEffect(() => {
    if (stop || remaining == null || remaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          onTimeUpRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stop, remaining]);

  const safeRemaining = remaining ?? 0;
  const minutes = Math.floor(safeRemaining / 60);
  const seconds = safeRemaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeUp = remaining !== null && remaining <= 0;
  const elapsed = totalSeconds !== null && remaining !== null ? Math.max(0, totalSeconds - remaining) : 0;

  return { remaining: safeRemaining, elapsed, formatted, isTimeUp };
}
