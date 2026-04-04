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
import { ExamSpeakingTimer } from '@/components/speaking-exam/exam-speaking-timer';
import { ExamEvaluationResult } from '@/components/speaking-exam/exam-evaluation-result';
import { ExamPart2IntroScreen, ExamPart2CueCardWithNote } from '@/components/speaking-exam/exam-part2-intro-screen';
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

  // Guard: prevent double-submit for the same question
  const submittedQuestionRef = useRef<number | null>(null);

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
    // AI speaks introduction before recording starts
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const intro = new SpeechSynthesisUtterance(
        'Your speaking task 2 is going to start, now.',
      );
      intro.lang = 'en-US';
      intro.rate = 0.9;

      intro.onend = () => {
        examRef.current.startSpeakingPart2();
        sttRef.current.startListening();
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(intro);
    } else {
      // Fallback: start immediately
      examRef.current.startSpeakingPart2();
      sttRef.current.startListening();
    }
  }, []);

  // ── Auto-start AI intro for Cue Card ──────────────────────
  const isPrepActive = exam.examState === 'PART2_PREP' && !showPart2Intro;
  const isSpeakActive = exam.examState === 'PART2_SPEAKING';
  
  useEffect(() => {
    if (isPrepActive) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const intro = new SpeechSynthesisUtterance(
          'In this part, you will be given a topic card and you will have 1 to 2 minutes to talk about it. Before you talk, you will have exactly 1 minute to prepare, and you can make some notes on the paper provided if you wish.',
        );
        intro.lang = 'en-US';
        intro.rate = 0.9;
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(intro);
      }
    }
  }, [isPrepActive]);

  const timers = useSpeakingExamTimers(isPrepActive, isSpeakActive, handlePrepEnd, handleStopPart2);

  // ── Submit answer (Part 1 & 3) with double-submit guard ───
  const handleSubmitAnswer = useCallback(() => {
    const currentQ = examRef.current.currentQuestion;
    if (!currentQ) return;

    // Guard: don't submit twice for the same question
    if (submittedQuestionRef.current === currentQ.questionId) return;
    submittedQuestionRef.current = currentQ.questionId;

    sttRef.current.stopListening();
    examRef.current.sendTranscript(
      currentQ.partNumber,
      currentQ.questionId,
      sttRef.current.transcript || '[no response]',
    );
  }, []);

  // Reset guard when question changes
  useEffect(() => {
    if (exam.currentQuestion) {
      submittedQuestionRef.current = null;
    }
  }, [exam.currentQuestion?.questionId]);

  // ── Silence detection — Dynamic threshold by Part ─────────
  let part13SilenceThreshold = 6000;
  if (exam.currentQuestion?.partNumber === 1) part13SilenceThreshold = 4000;
  if (exam.currentQuestion?.partNumber === 3) part13SilenceThreshold = 6000;

  const isSilenceActive = exam.examState === 'RECORDING';
  useSilenceDetector(stt.transcript, isSilenceActive, handleSubmitAnswer, part13SilenceThreshold);

  // ── Silence detection — auto-stop after 10s silence in Part 2 ──────
  const isPart2SilenceActive =
    exam.examState === 'PART2_SPEAKING' &&
    stt.isListening &&
    !exam.isAudioPlaying;

  useSilenceDetector(stt.transcript, isPart2SilenceActive, handleStopPart2, 10000);

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

  // ── Auto-start mic when entering RECORDING state ──────────
  useEffect(() => {
    if (!exam.currentQuestion) {
      hasStartedMicForQuestionRef.current = null;
      return;
    }

    if (exam.examState === 'RECORDING') {
      const qId = exam.currentQuestion.questionId;
      if (hasStartedMicForQuestionRef.current !== qId && !sttRef.current.isListening) {
        hasStartedMicForQuestionRef.current = qId;
        sttRef.current.startListening();
      }
    }
  }, [exam.currentQuestion, exam.examState]);

  // ── End exam when evaluating ──────────────────────────────
  useEffect(() => {
    if (exam.examState === 'EVALUATING') {
      examRef.current.endExam();
    }
  }, [exam.examState]);

  // ── Skip prep handler ─────────────────────────────────────
  // ── Skip prep handler ─────────────────────────────────────
  const handleSkipPrep = useCallback(() => {
    // If they skip while AI is still reading the intro, stop the speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    handlePrepEnd();
  }, [handlePrepEnd]);

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
    (examState === 'AUDIO_PLAYING' || examState === 'RECORDING' || examState === 'PROCESSING') &&
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

  // Part 2: Show intro screen FIRST (before cue card)
  if (showPart2Intro && examState === 'PART2_PREP') {
    return (
      <PageShell wide>
        <ExamPart2IntroScreen
          onStartNow={() => setShowPart2Intro(false)}
        />
      </PageShell>
    );
  }

  // Part 2: Cue card with Note sidebar + thinking time
  if (examState === 'PART2_PREP' && exam.cueCard) {
    return (
      <PageShell wide>
        <ExamPart2CueCardWithNote
          topic={exam.cueCard.topic}
          prepTimer={timers.prepTimer}
          onSkipPrep={handleSkipPrep}
        />
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

  if (examState === 'PART_BRIDGE') {
    return (
      <PageShell>
        <ExamTransitionScreen message="Moving to next part..." />
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
          <Button onClick={() => router.push('/practice?skill=speaking')} variant="outline">
            Back to practice list
          </Button>
        </div>
      </PageShell>
    );
  }

  if (examState === 'CONN_ERROR') {
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
