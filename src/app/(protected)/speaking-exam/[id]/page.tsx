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

export default function SpeakingExamPage({ params }: Props) {
  const { id } = use(params);
  const testId = Number(id);
  const router = useRouter();
  const exam = useSpeakingExam();
  const stt = useAssemblyAISTT();
  const startedRef = useRef(false);

  // ── Handlers (defined before timers so they can be passed) ──
  const handleStopPart2 = useCallback(() => {
    stt.stopListening();
    exam.stopSpeakingPart2(stt.transcript || '[no response]');
  }, [stt, exam]);

  const handlePrepEnd = useCallback(() => {
    exam.startSpeakingPart2();
    stt.startListening();
  }, [exam, stt]);

  const timers = useSpeakingExamTimers(exam.examState, handlePrepEnd, handleStopPart2);

  // ── Connect WS on mount ────────────────────────────────────
  useEffect(() => {
    exam.connect();
    return () => exam.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start exam after WS connected ─────────────────────────
  useEffect(() => {
    if (exam.examState === 'CONNECTING' && !startedRef.current) {
      startedRef.current = true;
      // Small delay to ensure WS is fully ready
      const t = setTimeout(() => exam.startExam(testId), 300);
      return () => clearTimeout(t);
    }
  }, [exam.examState, exam, testId]);

  // ── Auto-start mic when TTS finishes (Part 1 & 3) ─────────
  useEffect(() => {
    if (!exam.currentQuestion) return;
    if (exam.isAudioPlaying) return;
    const state = exam.examState;
    if (state === 'PART1_QUESTIONING' || state === 'PART3_QUESTIONING') {
      stt.startListening();
    }
  }, [exam.currentQuestion, exam.isAudioPlaying, exam.examState, stt]);

  // ── Submit answer (Part 1 & 3) ────────────────────────────
  const handleSubmitAnswer = useCallback(() => {
    if (!exam.currentQuestion) return;
    stt.stopListening();
    exam.sendTranscript(
      exam.currentQuestion.partNumber,
      exam.currentQuestion.questionId,
      stt.transcript || '[no response]',
    );
  }, [exam, stt]);

  // ── End exam when evaluating ──────────────────────────────
  useEffect(() => {
    if (exam.examState === 'EVALUATING') {
      exam.endExam();
    }
  }, [exam.examState, exam]);

  // ── Render ────────────────────────────────────────────────
  const { examState } = exam;

  // Loading / connecting
  if (examState === 'IDLE' || examState === 'CONNECTING') {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-gray-600">Đang kết nối...</p>
        </div>
      </PageShell>
    );
  }

  // Part 1 & 3 Q&A
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

  // Part 2 prep
  if (examState === 'PART2_PREPARATION' && exam.cueCard) {
    return (
      <PageShell>
        <ExamCueCardDisplay topic={exam.cueCard.topic} prepTimer={timers.prepTimer} />
      </PageShell>
    );
  }

  // Part 2 speaking
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

  // Transitions
  if (examState === 'TRANSITIONING_TO_PART2' || examState === 'TRANSITIONING_TO_PART3') {
    return (
      <PageShell>
        <ExamTransitionScreen />
      </PageShell>
    );
  }

  // Evaluating
  if (examState === 'EVALUATING') {
    return (
      <PageShell>
        <ExamTransitionScreen message="Đang chấm điểm... Vui lòng đợi." />
      </PageShell>
    );
  }

  // Completed
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

  // Error
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
        <h1 className="mb-6 text-2xl font-bold text-gray-900">IELTS Speaking Exam</h1>
        {children}
      </div>
    </div>
  );
}
