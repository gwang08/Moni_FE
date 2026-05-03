'use client';

import { use, useEffect, useCallback, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeakingExam } from '@/hooks/use-speaking-exam';
import { useBrowserSTT } from '@/hooks/use-browser-stt';
import { useSpeakingExamTimers } from '@/hooks/use-speaking-exam-timers';
import { useSilenceDetector } from '@/hooks/use-silence-detector';
import { ExamGuideScreen, type RecordingMode } from '@/components/speaking-exam/exam-guide-screen';
import { ExamMicTestScreen } from '@/components/speaking-exam/exam-mic-test-screen';
import { ExamQuestionDisplay } from '@/components/speaking-exam/exam-question-display';
import { ExamSpeakingTimer } from '@/components/speaking-exam/exam-speaking-timer';
import { ExamEvaluationResult } from '@/components/speaking-exam/exam-evaluation-result';
import { ExamEvaluatingTracker } from '@/components/speaking-exam/exam-evaluating-tracker';
import { ExamPart2IntroScreen, ExamPart2CueCardWithNote } from '@/components/speaking-exam/exam-part2-intro-screen';
import { ExamPart1IntroScreen } from '@/components/speaking-exam/exam-part1-intro-screen';
import { ExamPart3IntroScreen } from '@/components/speaking-exam/exam-part3-intro-screen';
import { ExamTransitionScreen } from '@/components/speaking-exam/exam-transition-screen';
import { ExamErrorDisplay } from '@/components/speaking-exam/exam-error-display';
import { ExamProgressBar } from '@/components/speaking-exam/exam-progress-bar';
import { useSessionRecorder } from '@/hooks/use-session-recorder';
import { X, Volume2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuthStore } from '@/store/auth-store';

// Local UI stages (before/between exam states)
type UIStage = 'GUIDE' | 'MIC_TEST' | 'EXAM';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getAuthToken(): string {
  const stored = localStorage.getItem('auth-storage');
  if (!stored) return '';
  try {
    const { state } = JSON.parse(stored);
    return state?.token || '';
  } catch {
    return '';
  }
}

async function uploadAudioBlob(blob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
    formData.append('file', file);
    
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/api/v1/user/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
    if (res.ok) {
      const json = await res.json();
      return json.result || '';
    }
  } catch (e) {
    console.error('Audio upload failed', e);
  }
  return '';
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function SpeakingExamPage({ params }: Props) {
  const { id } = use(params);
  const testId = Number(id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const slotId = searchParams.get('slotId');

  const [uiStage, setUIStage] = useState<UIStage>('GUIDE');
  const [showQuestionAlways, setShowQuestionAlways] = useState(false);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('auto');
  const [showPart1Intro, setShowPart1Intro] = useState(true);
  const [showPart2Intro, setShowPart2Intro] = useState(false);
  const [showPart3Intro, setShowPart3Intro] = useState(false);
  const [showOutro, setShowOutro] = useState(false);

  // Track current part and question index for progress bar
  const [currentPart, setCurrentPart] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const exam = useSpeakingExam();
  const stt = useBrowserSTT();
  const startedRef = useRef(false);

  // Fetch test info to dynamically configure progress bar questions length
  const [partConfig, setPartConfig] = useState<Record<number, number>>({ 1: 12, 2: 1, 3: 6 });
  const [testTitle, setTestTitle] = useState('IELTS Speaking Test');
  const [hintMap, setHintMap] = useState<Record<number, string>>({});

  useEffect(() => {
    import('@/lib/tests-api').then(({ getPublicTestDetail }) => {
      getPublicTestDetail(id).then((test) => {
        if (test.title) setTestTitle(test.title);
        const config = { 1: 0, 2: 0, 3: 0 };
        test.stimuli.forEach(st => {
          if (st.section && st.section >= 1 && st.section <= 3) {
            config[st.section as 1|2|3] += st.questionGroups.reduce((acc, g) => {
              // Only count interactive questions (position > 0), ignore intro/transition text (position == 0)
              const interactiveQuestions = g.questions.filter((q: any) => q.position > 0).length;
              return acc + interactiveQuestions;
            }, 0);
          }
        });
        setPartConfig({
          1: config[1],
          2: config[2],
          3: config[3],
        });
        // Build hint map from question explanations
        const hints: Record<number, string> = {};
        test.stimuli.forEach((st: any) => {
          st.questionGroups?.forEach((g: any) => {
            g.questions?.forEach((q: any) => {
              if (q.id && q.explanation?.text) {
                hints[q.id] = q.explanation.text;
              }
            });
          });
        });
        setHintMap(hints);
      }).catch(e => console.error('Failed to fetch test details', e));
    });
  }, [id]);

  // Update progress bar when current question changes
  const seenQuestionsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (exam.currentQuestion) {
      const part = exam.currentQuestion.partNumber;
      const qId = exam.currentQuestion.questionId;
      const qIndex = exam.currentQuestion.questionIndex;

      if (exam.resumedQuestionIndex !== undefined) {
        setCurrentPart(part);
        setCurrentQuestionIndex(exam.resumedQuestionIndex);
        exam.clearResumedQuestionIndex();
        seenQuestionsRef.current.add(qId);
      } else if (!seenQuestionsRef.current.has(qId)) {
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
            if (qIndex !== undefined) {
              setCurrentQuestionIndex(qIndex);
            } else {
              setCurrentQuestionIndex((prev) => prev + 1);
            }
          }
          return part;
        });
      } else if (qIndex !== undefined) {
        // Even if we've seen this question ID before (e.g. effect re-ran), 
        // sync the index if the backend provided it
        setCurrentQuestionIndex(qIndex);
      }
    }
  }, [exam.currentQuestion?.questionId, exam.currentQuestion?.questionIndex, exam.resumedQuestionIndex, exam.clearResumedQuestionIndex]);

  // Derive current hint for manual mode
  const currentHint = recordingMode === 'manual' && exam.currentQuestion
    ? hintMap[exam.currentQuestion.questionId] ?? null
    : null;

  // When Part 2 starts (from backend cue_card event), show intro and update progress bar
  useEffect(() => {
    if (exam.examState === 'PART2_PREP') {
      setShowPart2Intro(true);
      setCurrentPart(2);
      setCurrentQuestionIndex(0);
      examRef.current?.setPausePlayback(true);
    }
  }, [exam.examState]);

  // ── Session Recorder to capture local answers ─────────────
  const recordedAnswers = useSessionRecorder(
    exam.examState,
    exam.currentQuestion,
    exam.cueCard,
    stt.transcript
  );

  // Guard: prevent double-submit for the same question
  const submittedQuestionRef = useRef<number | null>(null);

  // Refs to avoid unstable dependencies causing infinite loops
  const sttRef = useRef(stt);
  useEffect(() => { sttRef.current = stt; }, [stt]);

  const examRef = useRef(exam);
  useEffect(() => { examRef.current = exam; }, [exam]);

  // Track if we already started listening for the current question
  const hasStartedMicForQuestionRef = useRef<number | null>(null);

  // Mốc thời gian khi user bắt đầu nói cho câu hiện tại — để tính durationMs gửi backend.
  const micStartTimeRef = useRef<number>(0);
  const markMicStart = useCallback(() => {
    micStartTimeRef.current = Date.now();
  }, []);
  const consumeMicDuration = useCallback(() => {
    const start = micStartTimeRef.current;
    micStartTimeRef.current = 0;
    return start ? Date.now() - start : 0;
  }, []);

  // ── Handlers (defined before timers so they can be passed) ──
  const handleStopPart2 = useCallback(async () => {
    const audioBlob = await sttRef.current.stopListening();
    const durationMs = consumeMicDuration();
    let audioUrl = '';
    if (audioBlob) {
      audioUrl = await uploadAudioBlob(audioBlob);
    }
    examRef.current.stopSpeakingPart2(
      sttRef.current.transcript || '[no response]',
      audioUrl,
      durationMs,
    );
  }, [consumeMicDuration]);

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
        markMicStart();
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(intro);
    } else {
      // Fallback: start immediately
      examRef.current.startSpeakingPart2();
      sttRef.current.startListening();
      markMicStart();
    }
  }, [markMicStart]);

  // ── Auto-start AI intro for Cue Card ──────────────────────
  const isPrepActive = exam.examState === 'PART2_PREP' && !showPart2Intro;
  const isSpeakActive = exam.examState === 'PART2_SPEAKING';

  const timers = useSpeakingExamTimers(isPrepActive, isSpeakActive, handlePrepEnd, handleStopPart2);

  // ── Submit answer (Part 1 & 3) with double-submit guard ───
  const handleSubmitAnswer = useCallback(async () => {
    const currentQ = examRef.current.currentQuestion;
    if (!currentQ) return;

    // Guard: don't submit twice for the same question
    if (submittedQuestionRef.current === currentQ.questionId) return;
    submittedQuestionRef.current = currentQ.questionId;

    const audioBlob = await sttRef.current.stopListening();
    const durationMs = consumeMicDuration();
    let audioUrl = '';
    if (audioBlob) {
      audioUrl = await uploadAudioBlob(audioBlob);
    }

    examRef.current.sendTranscript(
      currentQ.partNumber,
      currentQ.questionId,
      sttRef.current.transcript || '[no response]',
      audioUrl,
      durationMs,
    );
  }, [consumeMicDuration]);

  // Reset guard when question changes
  useEffect(() => {
    if (exam.currentQuestion) {
      submittedQuestionRef.current = null;
    }
  }, [exam.currentQuestion?.questionId]);

  // ── Silence detection — Dynamic threshold by Part ─────────
  const part13SilenceThreshold = 7000; // 7 seconds for Part 1 and 3

  const isSilenceActive = exam.examState === 'RECORDING' && recordingMode === 'auto';
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

  // ── Auto-start mic when entering RECORDING state (auto mode only) ──
  useEffect(() => {
    if (!exam.currentQuestion) {
      hasStartedMicForQuestionRef.current = null;
      return;
    }

    if (exam.examState === 'RECORDING' && recordingMode === 'auto') {
      const qId = exam.currentQuestion.questionId;
      if (hasStartedMicForQuestionRef.current !== qId && !sttRef.current.isListening) {
        hasStartedMicForQuestionRef.current = qId;
        sttRef.current.startListening();
        markMicStart();
      }
    }
  }, [exam.currentQuestion, exam.examState, recordingMode, markMicStart]);

  // ── Manual mic handlers ───────────────────────────────────
  const handleManualStartMic = useCallback(() => {
    if (!sttRef.current.isListening) {
      sttRef.current.startListening();
      markMicStart();
    }
  }, [markMicStart]);

  const handleManualStopMic = useCallback(() => {
    handleSubmitAnswer();
  }, [handleSubmitAnswer]);

  // ── End exam when evaluating ──────────────────────────────
  useEffect(() => {
    if (exam.examState === 'EVALUATING') {
      examRef.current.endExam();
      setCurrentPart(4);

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setShowOutro(true);
        const outroText = "That's all of your IELTS speaking test. Please wait a moment while we evaluate your responses.";
        const outro = new SpeechSynthesisUtterance(outroText);
        outro.lang = 'en-US';
        outro.rate = 0.9;
        
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) || voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) outro.voice = englishVoice;

        outro.onend = () => setShowOutro(false);
        outro.onerror = () => setShowOutro(false);
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(outro);

        // Fallback safety timeout in case speech engine hangs
        setTimeout(() => setShowOutro(false), 8000);
      }
    }
  }, [exam.examState]);

  // ── Refresh credit balance & complete slot when exam completes ────────────
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  useEffect(() => {
    if (exam.examState === 'COMPLETED') {
      refreshProfile();
      if (slotId) {
        const band = exam.evaluation?.final_band ?? 0;
        import('@/lib/roadmap-api').then(({ completeSlot }) => {
          completeSlot(Number(slotId), band, 9).catch(() => {});
        });
      }
    }
  }, [exam.examState, refreshProfile, slotId]);

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
          recordingMode={recordingMode}
          onChangeRecordingMode={setRecordingMode}
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

  // Exam Start Gate (if connected but waiting for user to start)
  if (uiStage === 'EXAM' && showPart1Intro && exam.isWsConnected) {
    return (
      <PageShell wide currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
        {partConfig[1] > 0 ? (
          <ExamPart1IntroScreen onStartNow={() => setShowPart1Intro(false)} />
        ) : (
          <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white min-h-[500px]">
            <div className="py-6 text-center">
              <h2 className="text-[20px] font-bold text-[#334155]">
                {partConfig[2] > 0 ? 'Speaking Part 2 Practice' : 'Speaking Part 3 Practice'}
              </h2>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center mb-10">
              <p className="text-[#334155] max-w-lg text-[15px] leading-relaxed">
                You are about to start a practice exam focused on {partConfig[2] > 0 ? 'Part 2' : 'Part 3'}.
              </p>
              <p className="text-[#334155] max-w-lg text-[15px] leading-relaxed mt-2">
                Make sure your microphone is ready. Click the button below to connect with the AI Examiner.
              </p>
            </div>
            <div className="flex justify-center border-t border-gray-100 p-5 bg-white shrink-0 mt-auto">
              <Button
                onClick={() => setShowPart1Intro(false)}
                className="gap-2 rounded-full bg-[#ff7b42] px-8 py-5 text-[15px] text-white hover:bg-[#ea580c] shadow-sm font-medium"
              >
                <Play className="h-4 w-4 fill-current" />
                Start Practice
              </Button>
            </div>
          </div>
        )}
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
          showQuestionAlways={showQuestionAlways}
          onSubmitAnswer={handleSubmitAnswer}
          recordingMode={recordingMode}
          onManualStartMic={handleManualStartMic}
          onManualStopMic={handleManualStopMic}
          hintText={currentHint}
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

  // Part 2: Cue card with Note sidebar + thinking time + speaking
  if ((examState === 'PART2_PREP' || examState === 'PART2_SPEAKING') && exam.cueCard) {
    return (
      <PageShell wide currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
        <ExamPart2CueCardWithNote
          topic={exam.cueCard.topic}
          isPrepPhase={examState === 'PART2_PREP'}
          prepTimer={timers.prepTimer}
          onSkipPrep={handleSkipPrep}
          speakTimer={timers.speakTimer}
          isListening={stt.isListening}
          onStopSpeaking={handleStopPart2}
          hintText={recordingMode === 'manual' && exam.cueCard.questionId ? hintMap[exam.cueCard.questionId] ?? null : null}
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
    if (showOutro) {
       return (
         <PageShell currentPart={currentPart} currentQuestionIndex={currentQuestionIndex} partConfig={partConfig}>
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[50vh] bg-white rounded-lg border border-gray-200">
               <div className="mb-6 relative flex items-center justify-center">
                 <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-green-400 opacity-20"></span>
                 <div className="relative bg-green-500 rounded-full p-4 shadow-lg shadow-green-200">
                   <Volume2 className="text-white h-8 w-8" />
                 </div>
               </div>
               <h2 className="text-2xl font-bold text-[#334155] mb-4">Exam Completed!</h2>
               <p className="text-blue-600 font-medium text-lg leading-relaxed max-w-sm">
                 That&apos;s all of your IELTS speaking test.<br/><br/>
                 Please wait a moment while we evaluate your responses.
               </p>
            </div>
         </PageShell>
       );
    }

    return (
      <PageShell>
        <ExamEvaluatingTracker onComplete={exam.completeAnimation} />
      </PageShell>
    );
  }

  if (examState === 'COMPLETED' && exam.evaluation) {
    return (
      <PageShell>
        <ExamEvaluationResult 
          evaluation={exam.evaluation} 
          recordings={recordedAnswers}
          title={testTitle}
        />
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
