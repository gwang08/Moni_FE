import { useEffect, useRef, useState } from 'react';
import type { ExamState } from '@/types/speaking-exam.types';

/**
 * Manages Part 2 timers: 60s preparation + 120s speaking.
 */
export function useSpeakingExamTimers(
  isPrepActive: boolean,
  isSpeakActive: boolean,
  onPrepEnd: () => void,
  onSpeakEnd: () => void,
) {
  const [prepTimer, setPrepTimer] = useState(60);
  const [speakTimer, setSpeakTimer] = useState(120);
  const onPrepEndRef = useRef(onPrepEnd);
  const onSpeakEndRef = useRef(onSpeakEnd);
  
  useEffect(() => {
    onPrepEndRef.current = onPrepEnd;
    onSpeakEndRef.current = onSpeakEnd;
  }, [onPrepEnd, onSpeakEnd]);

  // Part 2 preparation countdown (60s)
  useEffect(() => {
    if (!isPrepActive) return;
    setPrepTimer(60);

    const interval = setInterval(() => {
      setPrepTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onPrepEndRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPrepActive]);

  // Part 2 speaking countdown (120s)
  useEffect(() => {
    if (!isSpeakActive) return;
    setSpeakTimer(120);

    const interval = setInterval(() => {
      setSpeakTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onSpeakEndRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSpeakActive]);

  return { prepTimer, speakTimer };
}
