import { useEffect, useRef, useState } from 'react';

/**
 * Countdown timer for exam mode.
 * @param durationMinutes - total time in minutes (from test.duration)
 * @param stop - stop counting when true (submitted)
 * @param onTimeUp - callback when time reaches 0
 * @returns remaining seconds + formatted string + whether time is up
 */
export function useCountdownTimer(
  durationMinutes: number,
  stop: boolean,
  onTimeUp?: () => void,
) {
  const totalSeconds = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

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
