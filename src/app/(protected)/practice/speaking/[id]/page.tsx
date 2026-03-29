'use client';

import { use, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeakingExam } from '@/hooks/use-speaking-exam';
import { useAssemblyAISTT } from '@/hooks/use-assemblyai-stt';
import { useSpeakingExamTimers } from '@/hooks/use-speaking-exam-timers';
import { ExamQuestionDisplay } from '@/components/speaking-exam/exam-question-display';
import { ExamCueCardDisplay } from '@/components/speaking-exam/exam-cue-card-display';
import { ExamSpeakingTimer } from '@/components/speaking-exam/exam-speaking-timer';
import { ExamEvaluationResult } from '@/components/speaking-exam/exam-evaluation-result';
import { ExamTransitionScreen } from '@/components/speaking-exam/exam-transition-screen';
import { ExamErrorDisplay } from '@/components/speaking-exam/exam-error-display';

interface Props {
  params: Promise<{ id: string }>;
}

export default function SpeakingPracticePage({ params }: Props) {
  const { id } = use(params);
  const testId = Number(id);
  const router = useRouter();
  
  const exam = useSpeakingExam();
  const stt = useAssemblyAISTT();
  const startedRef = useRef(false);

  // Refs to avoid unstable dependencies causing infinite loops
  const sttRef = useRef(stt);
  useEffect(() => { sttRef.current = stt; }, [stt]);

  const examRef = useRef(exam);
  useEffect(() => { examRef.current = exam; }, [exam]);

  // Track if we already started listening for the current question
  const hasStartedMicForQuestionRef = useRef<number | null>(null);

  // ── Handlers (defined before timers so they can be passed) ──
  const handleStopPart2 = useCallback(() => {
    sttRef.current.stopListening();
    examRef.current.stopSpeakingPart2(sttRef.current.transcript || '[no response]');
  }, []);

  const handlePrepEnd = useCallback(() => {
    examRef.current.startSpeakingPart2();
    sttRef.current.startListening();
  }, []);

  const timers = useSpeakingExamTimers(exam.examState, handlePrepEnd, handleStopPart2);

  // ── Connect WS on mount ────────────────────────────────────
  useEffect(() => {
    examRef.current.connect();
    return () => examRef.current.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start exam after WS connected ─────────────────────────
  useEffect(() => {
    if (exam.examState === 'CONNECTING' && !startedRef.current) {
      startedRef.current = true;
      const t = setTimeout(() => examRef.current.startExam(testId), 300);
      return () => clearTimeout(t);
    }
  }, [exam.examState, testId]);

  // ── Auto-start mic when TTS finishes (Part 1 & 3) ─────────
  useEffect(() => {
    // If no question is active, reset our tracking ref
    if (!exam.currentQuestion) {
      hasStartedMicForQuestionRef.current = null;
      return;
    }
    
    // Defer taking mic if audio is actively playing
    if (exam.isAudioPlaying) return;

    const state = exam.examState;
    if (state === 'PART1_QUESTIONING' || state === 'PART3_QUESTIONING') {
      const qId = exam.currentQuestion.questionId;
      // Only start once per question
      if (hasStartedMicForQuestionRef.current !== qId && !sttRef.current.isListening) {
        hasStartedMicForQuestionRef.current = qId;
        sttRef.current.startListening();
      }
    }
  }, [exam.currentQuestion, exam.isAudioPlaying, exam.examState]);

  // ── Submit answer (Part 1 & 3) ────────────────────────────
  const handleSubmitAnswer = useCallback(() => {
    if (!examRef.current.currentQuestion) return;
    sttRef.current.stopListening();
    examRef.current.sendTranscript(
      examRef.current.currentQuestion.partNumber,
      examRef.current.currentQuestion.questionId,
      sttRef.current.transcript || '[no response]',
    );
  }, []);

  // ── End exam when evaluating ──────────────────────────────
  useEffect(() => {
    if (exam.examState === 'EVALUATING') {
      examRef.current.endExam();
    }
  }, [exam.examState]);

  // ── Render ────────────────────────────────────────────────
  const { examState } = exam;

  if (examState === 'IDLE' || examState === 'CONNECTING') {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-gray-600">Đang khởi tạo buổi thi (Real-time WS)...</p>
        </div>
      </PageShell>
    );
  }

  if (
    (examState === 'PART1_QUESTIONING' || examState === 'PART3_QUESTIONING') &&
    exam.currentQuestion
  ) {
    return (
      <PageShell>
        <ExamQuestionDisplay
          question={exam.currentQuestion}
          isAudioPlaying={exam.isAudioPlaying}
          isListening={stt.isListening}
          transcript={stt.transcript}
          onSubmitAnswer={handleSubmitAnswer}
        />
      </PageShell>
    );
  }

  if (examState === 'PART2_PREPARATION' && exam.cueCard) {
    return (
      <PageShell>
        <ExamCueCardDisplay topic={exam.cueCard.topic} prepTimer={timers.prepTimer} />
      </PageShell>
    );
  }

  if (examState === 'PART2_SPEAKING') {
    return (
      <PageShell>
        <ExamSpeakingTimer
          speakTimer={timers.speakTimer}
          transcript={stt.transcript}
          isListening={stt.isListening}
          onStop={handleStopPart2}
        />
      </PageShell>
    );
  }

  if (examState === 'TRANSITIONING_TO_PART2' || examState === 'TRANSITIONING_TO_PART3') {
    return (
      <PageShell>
        <ExamTransitionScreen />
      </PageShell>
    );
  }

  if (examState === 'EVALUATING') {
    return (
      <PageShell>
        <ExamTransitionScreen message="Đang chấm điểm... Vui lòng đợi." />
      </PageShell>
    );
  }

  if (examState === 'COMPLETED' && exam.evaluation) {
    return (
      <PageShell>
        <ExamEvaluationResult evaluation={exam.evaluation} />
        <div className="mt-8 flex justify-center">
          <Button onClick={() => router.push('/practice')} variant="outline">
            Quay về danh sách bài tập
          </Button>
        </div>
      </PageShell>
    );
  }

  if (examState === 'ERROR') {
    return (
      <PageShell>
        <ExamErrorDisplay error={exam.error || 'Đã xảy ra lỗi không xác định'} onRetry={() => {
          startedRef.current = false;
          exam.connect();
        }} />
      </PageShell>
    );
  }

  return <PageShell><ExamTransitionScreen message="Đang tải..." /></PageShell>;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">IELTS Speaking Exam (Mock Mode)</h1>
        {children}
      </div>
    </div>
  );
}
