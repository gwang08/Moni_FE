'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/user-store';
import { calculateOverallScore } from '@/lib/calendar-utils';
import { submitPlacement } from '@/lib/placement-api';
import type { PlacementTestPair, PlacementResult } from '@/types/placement.types';

import { ReadingTestStep } from '@/components/placement/reading-test-step';
import { ListeningTestStep } from '@/components/placement/listening-test-step';
import { WritingSpeakingStep } from '@/components/placement/writing-speaking-step';
import { ResultStep } from '@/components/placement/result-step';

import { useElapsedTimer } from '@/hooks/use-elapsed-timer';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type PlacementStep = 'loading' | 'reading' | 'listening' | 'writing-speaking' | 'result';

export default function PlacementPage() {
  const setPlacementResult = useUserStore((s) => s.setPlacementResult);
  const targetScores = useUserStore((s) => s.targetScores);
  const overallTarget = calculateOverallScore(targetScores) || 0;

  const [step, setStep] = useState<PlacementStep>('loading');
  const [testPair, setTestPair] = useState<PlacementTestPair | null>(null);
  const [readingAnswers, setReadingAnswers] = useState<Record<number, number>>({});
  const [readingTextAnswers, setReadingTextAnswers] = useState<Record<number, string>>({});
  const [listeningAnswers, setListeningAnswers] = useState<Record<number, number>>({});
  const [listeningTextAnswers, setListeningTextAnswers] = useState<Record<number, string>>({});
  const [writingSpeakingBands, setWritingSpeakingBands] = useState({ writing: 0, speaking: 0 });
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Timer: stop when result is shown
  const { elapsed, formatted: elapsedTime } = useElapsedTimer(step === 'result' || step === 'loading');

  // Guard against React strict mode double-firing the effect
  const loadedRef = useRef(false);

  // Load pre-generated test from sessionStorage
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const stored = sessionStorage.getItem('pending-placement-test');
    if (stored) {
      sessionStorage.removeItem('pending-placement-test');
      try {
        const pair: PlacementTestPair = JSON.parse(stored);
        setTestPair(pair);
        setStep('reading');
      } catch {
        window.location.href = '/dashboard';
      }
    } else {
      window.location.href = '/dashboard';
    }
  }, []);

  const handleSubmitTest = async () => {
    if (!testPair) return;
    setLoading(true);
    setConfirmOpen(false); // Close dialog if it was open (from Listening step)
    try {
      // ... (mapping answers)
      const readingAnswerList = Object.entries(readingAnswers).map(([qId, optId]) => ({
        questionId: Number(qId), selectedOptionId: optId,
      }));
      const readingTextList = Object.entries(readingTextAnswers)
        .filter(([, text]) => text.trim() !== '')
        .map(([qId, text]) => ({ questionId: Number(qId), answerText: text }));
      const listeningAnswerList = Object.entries(listeningAnswers).map(([qId, optId]) => ({
        questionId: Number(qId), selectedOptionId: optId,
      }));
      const listeningTextList = Object.entries(listeningTextAnswers)
        .filter(([, text]) => text.trim() !== '')
        .map(([qId, text]) => ({ questionId: Number(qId), answerText: text }));

      const res = await submitPlacement({
        readingTestId: testPair.readingTest.id,
        listeningTestId: testPair.listeningTest.id,
        readingAnswers: [...readingAnswerList, ...readingTextList],
        listeningAnswers: [...listeningAnswerList, ...listeningTextList],
        writingBand: writingSpeakingBands.writing,
        speakingBand: writingSpeakingBands.speaking,
        targetBand: overallTarget,
      });
      setResult(res);
      setPlacementResult(res);
      setStep('result');
    } catch {
      toast.error('Không thể nộp bài. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (setter: typeof setReadingAnswers) => (qId: number, optId: number) => {
    if (optId === 0) {
      setter((prev) => { const next = { ...prev }; delete next[qId]; return next; });
    } else {
      setter((prev) => ({ ...prev, [qId]: optId }));
    }
  };

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'reading' && testPair) {
    const totalQ = testPair.readingTest.stimuli.reduce((acc, s) => acc + s.questionGroups.reduce((acc2, g) => acc2 + g.questions.length, 0), 0);
    const answered = Object.keys(readingAnswers).length + Object.keys(readingTextAnswers).length;
    const remaining = totalQ - answered;

    return (
      <>
        <ReadingTestStep
          testDetail={testPair.readingTest}
          answers={readingAnswers}
          textAnswers={readingTextAnswers}
          onAnswer={handleAnswer(setReadingAnswers)}
          onTextAnswer={(qId, text) => setReadingTextAnswers((prev) => ({ ...prev, [qId]: text }))}
          onComplete={() => setConfirmOpen(true)}
          elapsedTime={elapsedTime}
        />
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Nộp bài Reading?"
          description={remaining > 0 ? `Bạn còn ${remaining} câu chưa làm. Bạn có chắc muốn chuyển sang phần Listening?` : 'Bạn đã làm xong phần Reading. Bấm Xác nhận để chuyển sang phần Listening.'}
          confirmText="Xác nhận"
          onConfirm={() => {
            setConfirmOpen(false);
            setStep('listening');
          }}
        />
      </>
    );
  }

  if (step === 'listening' && testPair) {
    const totalQ = testPair.listeningTest.stimuli.reduce((acc, s) => acc + s.questionGroups.reduce((acc2, g) => acc2 + g.questions.length, 0), 0);
    const answered = Object.keys(listeningAnswers).length + Object.keys(listeningTextAnswers).length;
    const remaining = totalQ - answered;

    return (
      <>
        <ListeningTestStep
          testDetail={testPair.listeningTest}
          answers={listeningAnswers}
          textAnswers={listeningTextAnswers}
          onAnswer={handleAnswer(setListeningAnswers)}
          onTextAnswer={(qId, text) => setListeningTextAnswers((prev) => ({ ...prev, [qId]: text }))}
          onComplete={() => setConfirmOpen(true)}
          elapsedTime={elapsedTime}
        />
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Nộp bài Listening?"
          description={remaining > 0 ? `Bạn còn ${remaining} câu chưa làm. Bạn có chắc muốn chuyển sang phần tiếp theo?` : 'Bạn đã làm xong phần Listening. Bấm Xác nhận để sang phần đánh giá trình độ Writing & Speaking.'}
          confirmText="Xác nhận"
          onConfirm={() => {
            setConfirmOpen(false);
            setStep('writing-speaking');
          }}
        />
      </>
    );
  }

  if (step === 'writing-speaking') {
    return (
      <WritingSpeakingStep
        bands={writingSpeakingBands}
        onBandChange={(skill, value) => setWritingSpeakingBands((prev) => ({ ...prev, [skill]: value }))}
        onComplete={handleSubmitTest}
        loading={loading}
      />
    );
  }

  if (step === 'result' && result) {
    return <ResultStep result={result} />;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
