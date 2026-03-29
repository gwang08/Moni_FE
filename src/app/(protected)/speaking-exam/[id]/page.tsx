'use client';

import { use, useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeakingExam } from '@/hooks/use-speaking-exam';
import { useAssemblyAISTT } from '@/hooks/use-assemblyai-stt';
import { useSpeakingExamTimers } from '@/hooks/use-speaking-exam-timers';
import { useSilenceDetector } from '@/hooks/use-silence-detector';
import { ExamGuideScreen } from '@/components/speaking-exam/exam-guide-screen';
import { ExamMicTestScreen } from '@/components/speaking-exam/exam-mic-test-screen';
import { ExamQuestionDisplay } from '@/components/speaking-exam/exam-question-display';
import { ExamCueCardDisplay } from '@/components/speaking-exam/exam-cue-card-display';
import { ExamSpeakingTimer } from '@/components/speaking-exam/exam-speaking-timer';
import { ExamEvaluationResult } from '@/components/speaking-exam/exam-evaluation-result';
import { ExamPart2IntroScreen } from '@/components/speaking-exam/exam-part2-intro-screen';
import { ExamTransitionScreen } from '@/components/speaking-exam/exam-transition-screen';
import { ExamErrorDisplay } from '@/components/speaking-exam/exam-error-display';

// Local UI stages (before/between exam states)
type UIStage = 'GUIDE' | 'MIC_TEST' | 'EXAM';

interface Props {
  params: Promise<{ id: string }>;
}

export default function SpeakingExamPage({ params }: Props) {
  const { id } = use(params);
  const testId = Number(id);
  const router = useRouter();

  const [uiStage, setUIStage] = useState<UIStage>('GUIDE');
  const [showQuestionAlways, setShowQuestionAlways] = useState(false);
  const [showPart2Intro, setShowPart2Intro] = useState(false);

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

  // ── Silence detection — auto-submit after 6s silence ──────
  const isSilenceActive =
    (exam.examState === 'PART1_QUESTIONING' || exam.examState === 'PART3_QUESTIONING') &&
    stt.isListening &&
    !exam.isAudioPlaying;

  useSilenceDetector(stt.transcript, isSilenceActive, handleSubmitAnswer, 6000);

  // ── Connect WS when user starts test ──────────────────────
  const handleStartTest = useCallback(() => {
    setUIStage('EXAM');
    examRef.current.connect();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (examRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        examRef.current.disconnect();
      }
    };
  }, []);

  // ── Start exam after WS connected ─────────────────────────
  useEffect(() => {
    if (uiStage === 'EXAM' && exam.isWsConnected && !startedRef.current) {
      startedRef.current = true;
      examRef.current.startExam(testId);
    }
  }, [uiStage, exam.isWsConnected, testId]);

  // ── Auto-start mic when TTS finishes (Part 1 & 3) ─────────
  useEffect(() => {
    if (!exam.currentQuestion) {
      hasStartedMicForQuestionRef.current = null;
      return;
    }

    // Defer if audio is actively playing
    if (exam.isAudioPlaying) return;

    const state = exam.examState;
    if (state === 'PART1_QUESTIONING' || state === 'PART3_QUESTIONING') {
      const qId = exam.currentQuestion.questionId;
      if (hasStartedMicForQuestionRef.current !== qId && !sttRef.current.isListening) {
        hasStartedMicForQuestionRef.current = qId;
        sttRef.current.startListening();
      }
    }
  }, [exam.currentQuestion, exam.isAudioPlaying, exam.examState]);

  // ── Intercept Part 2 transition to show intro ─────────────
  useEffect(() => {
    if (exam.examState === 'TRANSITIONING_TO_PART2') {
      setShowPart2Intro(true);
    }
  }, [exam.examState]);

  // ── End exam when evaluating ──────────────────────────────
  useEffect(() => {
    if (exam.examState === 'EVALUATING') {
      examRef.current.endExam();
    }
  }, [exam.examState]);

  // ── RENDER ────────────────────────────────────────────────

  // Stage 1: Guide screen
  if (uiStage === 'GUIDE') {
    return (
      <PageShell>
        <ExamGuideScreen
          onNext={() => setUIStage('MIC_TEST')}
          showQuestion={showQuestionAlways}
          onToggleShowQuestion={setShowQuestionAlways}
        />
      </PageShell>
    );
  }

  // Stage 2: Mic test
  if (uiStage === 'MIC_TEST') {
    return (
      <PageShell>
        <ExamMicTestScreen onStartTest={handleStartTest} onSkip={handleStartTest} />
      </PageShell>
    );
  }

  // Stage 3: Exam in progress
  const { examState } = exam;

  if (examState === 'IDLE' || examState === 'CONNECTING') {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-gray-600">Connecting to exam server...</p>
        </div>
      </PageShell>
    );
  }

  // Part 1 / Part 3 questioning
  if (
    (examState === 'PART1_QUESTIONING' || examState === 'PART3_QUESTIONING') &&
    exam.currentQuestion
  ) {
    return (
      <PageShell wide>
        <ExamQuestionDisplay
          question={exam.currentQuestion}
          isAudioPlaying={exam.isAudioPlaying}
          isListening={stt.isListening}
          transcript={stt.transcript}
          showQuestionAlways={showQuestionAlways}
          onSubmitAnswer={handleSubmitAnswer}
        />
      </PageShell>
    );
  }

  // Part 2: Show intro screen first, then cue card
  if (showPart2Intro && (examState === 'TRANSITIONING_TO_PART2' || examState === 'PART2_PREPARATION')) {
    return (
      <PageShell wide>
        <ExamPart2IntroScreen
          onStartNow={() => setShowPart2Intro(false)}
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

  if (examState === 'TRANSITIONING_TO_PART3') {
    return (
      <PageShell>
        <ExamTransitionScreen message="Moving to Part 3..." />
      </PageShell>
    );
  }

  if (examState === 'EVALUATING') {
    return (
      <PageShell>
        <ExamTransitionScreen message="Evaluating your responses... Please wait." />
      </PageShell>
    );
  }

  if (examState === 'COMPLETED' && exam.evaluation) {
    return (
      <PageShell>
        <ExamEvaluationResult evaluation={exam.evaluation} />
        <div className="mt-8 flex justify-center">
          <Button onClick={() => router.push('/speaking-exam')} variant="outline">
            Back to exam list
          </Button>
        </div>
      </PageShell>
    );
  }

  if (examState === 'ERROR') {
    return (
      <PageShell>
        <ExamErrorDisplay
          error={exam.error || 'An unexpected error occurred'}
          onRetry={() => {
            startedRef.current = false;
            setUIStage('GUIDE');
          }}
        />
      </PageShell>
    );
  }

  return <PageShell><ExamTransitionScreen message="Loading..." /></PageShell>;
}

function PageShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className={`mx-auto ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">IELTS Speaking Exam</h1>
        {children}
      </div>
    </div>
  );
}
