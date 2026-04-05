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
import { ExamPart1IntroScreen } from '@/components/speaking-exam/exam-part1-intro-screen';
import { ExamPart3IntroScreen } from '@/components/speaking-exam/exam-part3-intro-screen';
import { ExamTransitionScreen } from '@/components/speaking-exam/exam-transition-screen';
import { ExamErrorDisplay } from '@/components/speaking-exam/exam-error-display';
import { ExamProgressBar } from '@/components/speaking-exam/exam-progress-bar';
import { X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  const [showPart1Intro, setShowPart1Intro] = useState(true);
  const [showPart2Intro, setShowPart2Intro] = useState(false);
  const [showPart3Intro, setShowPart3Intro] = useState(false);

  // Track current part and question index for progress bar
  const [currentPart, setCurrentPart] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const exam = useSpeakingExam();
  const stt = useAssemblyAISTT();
  const startedRef = useRef(false);

  // Fetch test info to dynamically configure progress bar questions length
  const [partConfig, setPartConfig] = useState<Record<number, number>>({ 1: 12, 2: 1, 3: 6 });
  useEffect(() => {
    import('@/lib/tests-api').then(({ getPublicTestDetail }) => {
      getPublicTestDetail(id).then((test) => {
        const config = { 1: 0, 2: 0, 3: 0 };
        test.stimuli.forEach(st => {
          if (st.section && st.section >= 1 && st.section <= 3) {
            config[st.section as 1|2|3] += st.questionGroups.reduce((acc, g) => acc + g.questions.length, 0);
          }
        });
        setPartConfig(prev => ({
          1: config[1] || prev[1],
          2: config[2] || prev[2],
          3: config[3] || prev[3],
        }));
      }).catch(e => console.error('Failed to fetch test details', e));
    });
  }, [id]);

  // Update progress bar when current question changes
  const seenQuestionsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (exam.currentQuestion) {
      const part = exam.currentQuestion.partNumber;
      const qId = exam.currentQuestion.questionId;

      if (!seenQuestionsRef.current.has(qId)) {
        seenQuestionsRef.current.add(qId);
        
        setCurrentPart((prevPart) => {
          if (part !== prevPart) {
            // New part started
            setCurrentQuestionIndex(0);
            
            if (part === 3) {
              setShowPart3Intro(true);
              examRef.current?.setPausePlayback(true);
            }
          } else {
            // Continuation of same part
            setCurrentQuestionIndex((prev) => prev + 1);
          }
          return part;
        });
      }
    }
  }, [exam.currentQuestion?.questionId]);

  // When Part 2 starts (from backend cue_card event), show intro and update progress bar
  useEffect(() => {
    if (exam.examState === 'PART2_PREP') {
      setShowPart2Intro(true);
      setCurrentPart(2);
      setCurrentQuestionIndex(0);
      examRef.current?.setPausePlayback(true);
    }
  }, [exam.examState]);

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
    if (uiStage === 'EXAM' && exam.isWsConnected && !showPart1Intro && !startedRef.current) {
      startedRef.current = true;
      examRef.current.startExam(testId);
    }
  }, [uiStage, exam.isWsConnected, showPart1Intro, testId]);

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
      <PageShell currentPart={0} currentQuestionIndex={0} partConfig={partConfig}>
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
      <PageShell currentPart={0} currentQuestionIndex={0} partConfig={partConfig}>
        <ExamMicTestScreen onStartTest={handleStartTest} onSkip={handleStartTest} />
      </PageShell>
    );
  }

  // Stage 3: Exam in progress
  const { examState } = exam;

  // Part 1 Intro (if connected but waiting for user to start Part 1)
  if (uiStage === 'EXAM' && showPart1Intro && exam.isWsConnected) {
    return (
      <PageShell wide currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
        <ExamPart1IntroScreen onStartNow={() => setShowPart1Intro(false)} />
      </PageShell>
    );
  }

  // Part 3 Intro (if connected but waiting for user to start Part 3)
  if (currentPart === 3 && showPart3Intro && exam.isWsConnected) {
    return (
      <PageShell wide currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
        <ExamPart3IntroScreen onStartNow={() => {
           setShowPart3Intro(false);
           examRef.current?.setPausePlayback(false);
           examRef.current?.playPendingAudio();
        }} />
      </PageShell>
    );
  }

  if (examState === 'IDLE' || examState === 'CONNECTING') {
    return (
      <PageShell currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
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
      <PageShell wide currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
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
      <PageShell wide currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
        <ExamPart2IntroScreen
          onStartNow={() => {
            setShowPart2Intro(false);
            
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              const intro = new SpeechSynthesisUtterance(
                'In this part, you will be given a topic card and you will have 1 to 2 minutes to talk about it. Before you talk, you will have exactly 1 minute to prepare, and you can make some notes on the paper provided if you wish.',
              );
              intro.lang = 'en-US';
              intro.rate = 0.9;
              
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(intro);
            }

            examRef.current?.setPausePlayback(false);
            examRef.current?.playPendingAudio();
          }}
        />
      </PageShell>
    );
  }

  // Part 2: Cue card with Note sidebar + thinking time
  if (examState === 'PART2_PREP' && exam.cueCard) {
    return (
      <PageShell wide currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
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
      <PageShell currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
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
      <PageShell currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
        <ExamTransitionScreen message="Moving to next part..." />
      </PageShell>
    );
  }

  if (examState === 'EVALUATING') {
    return (
      <PageShell currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
        <ExamTransitionScreen message="Evaluating your responses... Please wait." />
      </PageShell>
    );
  }

  if (examState === 'COMPLETED' && exam.evaluation) {
    return (
      <PageShell currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
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
      <PageShell currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
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

  return <PageShell currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}><ExamTransitionScreen message="Loading..." /></PageShell>;
}

function PageShell({ children, wide, currentPart, currentQuestionIndex, partConfig }: { 
  children: React.ReactNode; 
  wide?: boolean;
  currentPart?: number;
  currentQuestionIndex?: number;
  partConfig?: Record<number, number>;
}) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col h-[calc(100vh-75px)] bg-[#fcf9f5] relative overflow-hidden">
      {/* Nút Exit */}
      <button 
        onClick={() => setShowExitConfirm(true)}
        className="absolute top-4 left-4 md:top-8 md:left-8 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-700 transition z-10"
      >
        <X size={20} />
      </button>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
        <div className={`w-full mt-10 lg:mt-6 ${wide ? 'max-w-4xl' : 'max-w-3xl'}`}>
          {children}
        </div>
      </div>
      
      {currentPart !== undefined && currentQuestionIndex !== undefined && (
        <div className="shrink-0 w-full z-10 border-t border-none border-gray-200 bg-[#fcf9f5]">
          <ExamProgressBar currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig} />
        </div>
      )}

      {/* Dialog xác nhận thoát */}
      <ConfirmDialog
        open={showExitConfirm}
        onOpenChange={setShowExitConfirm}
        title="Thoát khỏi bài làm"
        description="Bạn ơi, bạn đang thoát khỏi phần làm bài, bạn có chắc chắn muốn thoát chứ"
        confirmText="Thoát"
        cancelText="Quay lại làm bài"
        variant="destructive"
        onConfirm={() => {
          router.push('/practice?skill=speaking');
        }}
      />
    </div>
  );
}
