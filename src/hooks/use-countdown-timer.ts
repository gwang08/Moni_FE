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
  const totalSeconds = initialRemainingSeconds ?? durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const initializedRef = useRef(false);

  // Re-init when server provides remainingSeconds (e.g., after session loads)
  useEffect(() => {
    if (initialRemainingSeconds != null && !initializedRef.current) {
      setRemaining(initialRemainingSeconds);
      initializedRef.current = true;
    }
  }, [initialRemainingSeconds]);

  useEffect(() => {
    if (stop || remaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
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

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeUp = remaining <= 0;
  const elapsed = totalSeconds - remaining;

  return { remaining, elapsed, formatted, isTimeUp };
}
