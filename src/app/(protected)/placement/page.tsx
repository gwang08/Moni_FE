'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/user-store';
import { calculateOverallScore } from '@/lib/calendar-utils';
import { submitPlacement } from '@/lib/placement-api';
import type { PlacementTestPair, PlacementResult } from '@/types/placement.types';

import { ReadingTestStep } from '@/components/placement/reading-test-step';
import { ListeningTestStep } from '@/components/placement/listening-test-step';
import { WritingTestStep } from '@/components/placement/writing-test-step';
import { SpeakingTestStep } from '@/components/placement/speaking-test-step';
import { GradingStep } from '@/components/placement/grading-step';
import { ResultStep } from '@/components/placement/result-step';

import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type PlacementStep = 'loading' | 'reading' | 'listening' | 'writing' | 'speaking' | 'grading' | 'result';

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
  const [writingEssay, setWritingEssay] = useState('');
  const [speakingAudioBlob, setSpeakingAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { elapsed, formatted: elapsedTime } = useElapsedTimer(
    step === 'result' || step === 'loading' || step === 'grading'
  );

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

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Remove data:audio/webm;base64, prefix
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmitTest = async () => {
    if (!testPair || !speakingAudioBlob) return;

    setStep('grading');

    try {
      const speakingBase64 = await blobToBase64(speakingAudioBlob);

      const readingAnswerList = Object.entries(readingAnswers).map(([qId, optId]) => ({
        questionId: Number(qId),
        selectedOptionId: optId,
      }));
      const readingTextList = Object.entries(readingTextAnswers)
        .filter(([, text]) => text.trim() !== '')
        .map(([qId, text]) => ({ questionId: Number(qId), answerText: text }));
      const listeningAnswerList = Object.entries(listeningAnswers).map(([qId, optId]) => ({
        questionId: Number(qId),
        selectedOptionId: optId,
      }));
      const listeningTextList = Object.entries(listeningTextAnswers)
        .filter(([, text]) => text.trim() !== '')
        .map(([qId, text]) => ({ questionId: Number(qId), answerText: text }));

      const writingTaskType = testPair.writingTest.section === 1 ? 1 : 2;
      const writingStimulusId = testPair.writingTest.stimuli?.[0]?.id;

      const res = await submitPlacement({
        readingTestId: testPair.readingTest.id,
        listeningTestId: testPair.listeningTest.id,
        readingAnswers: [...readingAnswerList, ...readingTextList],
        listeningAnswers: [...listeningAnswerList, ...listeningTextList],
        writingTestId: testPair.writingTest.id,
        writingEssay,
        writingTaskType,
        writingStimulusId,
        speakingTestId: testPair.speakingTest.id,
        speakingAudioBase64: speakingBase64,
        targetBand: overallTarget,
        elapsedSeconds: elapsed,
      });

      setResult(res);
      setPlacementResult(res);
      setStep('result');
    } catch {
      toast.error('Không thể nộp bài. Vui lòng thử lại.');
      setStep('speaking'); // Go back to speaking step
    }
  };

  const handleAnswer = (setter: typeof setReadingAnswers) => (qId: number, optId: number) => {
    if (optId === 0) {
      setter((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    } else {
      setter((prev) => ({ ...prev, [qId]: optId }));
    }
  };

  // Loading
  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Reading
  if (step === 'reading' && testPair) {
    const totalQ = testPair.readingTest.stimuli.reduce(
      (acc, s) => acc + s.questionGroups.reduce((acc2, g) => acc2 + g.questions.length, 0),
      0
    );
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
          description={
            remaining > 0
              ? `Bạn còn ${remaining} câu chưa làm. Bạn có chắc muốn chuyển sang phần Listening?`
              : 'Bạn đã làm xong phần Reading. Bấm Xác nhận để chuyển sang phần Listening.'
          }
          confirmText="Xác nhận"
          onConfirm={() => {
            setConfirmOpen(false);
            setStep('listening');
          }}
        />
      </>
    );
  }

  // Listening
  if (step === 'listening' && testPair) {
    const totalQ = testPair.listeningTest.stimuli.reduce(
      (acc, s) => acc + s.questionGroups.reduce((acc2, g) => acc2 + g.questions.length, 0),
      0
    );
    const answered = Object.keys(listeningAnswers).length + Object.keys(listeningTextAnswers).length;
    const remaining = totalQ - answered;

    return (
      <>
        <ListeningTestStep
          testDetail={testPair.listeningTest}
          answers={listeningAnswers}
          textAnswers={listeningTextAnswers}
          onAnswer={handleAnswer(setListeningAnswers)}
          onTextAnswer={(qId, text) =>
            setListeningTextAnswers((prev) => ({ ...prev, [qId]: text }))
          }
          onComplete={() => setConfirmOpen(true)}
          elapsedTime={elapsedTime}
        />
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Nộp bài Listening?"
          description={
            remaining > 0
              ? `Bạn còn ${remaining} câu chưa làm. Bạn có chắc muốn chuyển sang phần Writing?`
              : 'Bạn đã làm xong phần Listening. Bấm Xác nhận để chuyển sang phần Writing.'
          }
          confirmText="Xác nhận"
          onConfirm={() => {
            setConfirmOpen(false);
            setStep('writing');
          }}
        />
      </>
    );
  }

  // Writing
  if (step === 'writing' && testPair) {
    return (
      <WritingTestStep
        testDetail={testPair.writingTest}
        essay={writingEssay}
        onEssayChange={setWritingEssay}
        onComplete={() => setStep('speaking')}
        elapsedTime={elapsedTime}
      />
    );
  }

  // Speaking
  if (step === 'speaking' && testPair) {
    return (
      <SpeakingTestStep
        testDetail={testPair.speakingTest}
        audioBlob={speakingAudioBlob}
        onAudioChange={setSpeakingAudioBlob}
        onComplete={handleSubmitTest}
        elapsedTime={elapsedTime}
      />
    );
  }

  // Grading
  if (step === 'grading') {
    return <GradingStep />;
  }

  // Result
  if (step === 'result' && result) {
    return (
      <ResultStep
        result={result}
        testPair={testPair}
        readingAnswers={readingAnswers}
        readingTextAnswers={readingTextAnswers}
        listeningAnswers={listeningAnswers}
        listeningTextAnswers={listeningTextAnswers}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
