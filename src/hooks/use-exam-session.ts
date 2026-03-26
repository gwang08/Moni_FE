import { useState, useEffect, useRef, useCallback } from 'react';
import {
  startExam, getActiveSession, saveExamProgress, submitExam,
  type ExamSession,
} from '@/lib/exam-api';
import type { SubmitAttemptResponse } from '@/lib/practice-api';

const AUTO_SAVE_INTERVAL = 30_000; // 30 seconds

interface UseExamSessionReturn {
  session: ExamSession | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  isResuming: boolean;
  /** Call on every answer change to keep refs in sync for auto-save */
  syncAnswers: (answers: Record<number, number>, textAnswers: Record<number, string>) => void;
  submit: () => Promise<SubmitAttemptResponse>;
}

export function useExamSession(testId: number, enabled: boolean = true): UseExamSessionReturn {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const answersRef = useRef<Record<number, number>>({});
  const textAnswersRef = useRef<Record<number, string>>({});
  const sessionRef = useRef<ExamSession | null>(null);
  sessionRef.current = session;

  // Init: check active session or start new
  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        const active = await getActiveSession(testId);
        if (cancelled) return;

        if (active && active.status === 'IN_PROGRESS') {
          setSession(active);
          setIsResuming(true);
        } else if (active && active.status === 'EXPIRED') {
          setSession(active);
        } else {
          const newSession = await startExam(testId);
          if (cancelled) return;
          setSession(newSession);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Không thể khởi tạo phiên thi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [testId, enabled]);

  // Build answer payload from refs
  const buildPayload = useCallback(() => {
    const mcq = Object.entries(answersRef.current).map(([qId, optId]) => ({
      questionId: Number(qId),
      selectedOptionId: optId,
    }));
    const text = Object.entries(textAnswersRef.current)
      .filter(([, t]) => t.trim() !== '')
      .map(([qId, t]) => ({
        questionId: Number(qId),
        answerText: t,
      }));
    return [...mcq, ...text];
  }, []);

  // Auto-save interval
  useEffect(() => {
    if (!enabled || !session || session.status !== 'IN_PROGRESS') return;
    const interval = setInterval(() => {
      const s = sessionRef.current;
      if (!s || s.status !== 'IN_PROGRESS') return;
      const payload = buildPayload();
      if (payload.length === 0) return;
      setSaving(true);
      saveExamProgress(s.sessionId, payload)
        .catch(() => {}) // fire-and-forget
        .finally(() => setSaving(false));
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [enabled, session?.sessionId, session?.status, buildPayload]);

  // Sync answer refs (called by page on every answer change)
  const syncAnswers = useCallback(
    (answers: Record<number, number>, textAnswers: Record<number, string>) => {
      answersRef.current = answers;
      textAnswersRef.current = textAnswers;
    },
    []
  );

  // Submit: final save then submit
  const submitFn = useCallback(async (): Promise<SubmitAttemptResponse> => {
    const s = sessionRef.current;
    if (!s) throw new Error('No active session');
    // Final save before submit
    const payload = buildPayload();
    if (payload.length > 0) {
      await saveExamProgress(s.sessionId, payload).catch(() => {});
    }
    return submitExam(s.sessionId);
  }, [buildPayload]);

  // When disabled, return idle state
  if (!enabled) {
    return {
      session: null, loading: false, error: null,
      saving: false, isResuming: false,
      syncAnswers: () => {}, submit: async () => { throw new Error('Not in exam mode'); },
    };
  }

  return {
    session,
    loading,
    error,
    saving,
    isResuming,
    syncAnswers,
    submit: submitFn,
  };
}
