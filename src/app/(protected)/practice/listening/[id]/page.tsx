'use client';

import { use, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { ListeningPracticeHeader } from '@/components/listening/listening-practice-header';
import { ListeningAudioPlayer } from '@/components/listening/listening-audio-player';
import { ListeningQuestionNav } from '@/components/listening/listening-question-nav';
import { ListeningNotesSidebar } from '@/components/listening/listening-notes-sidebar';
import { ListeningExamView } from '@/components/listening/listening-exam-view';
import { ListeningPracticeView } from '@/components/listening/listening-practice-view';
import { ReadingQuestionsPanel } from '@/components/reading/reading-questions-panel';
import { useListeningStore } from '@/store/listening-store';
import { usePracticeStore } from '@/store/practice-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { useCountdownTimer } from '@/hooks/use-countdown-timer';
import { useExamSession } from '@/hooks/use-exam-session';
import { submitAttempt } from '@/lib/practice-api';
import { updateTaskStatus } from '@/lib/roadmap-api';
import type { SavedAnswer } from '@/lib/exam-api';

function parseSavedAnswers(savedAnswers: SavedAnswer[]) {
  const answers: Record<number, number> = {};
  const textAnswers: Record<number, string> = {};
  for (const sa of savedAnswers) {
    if (sa.selectedOptionId != null) answers[sa.questionId] = sa.selectedOptionId;
    if (sa.answerText) textAnswers[sa.questionId] = sa.answerText;
  }
  return { answers, textAnswers };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ListeningExercisePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmapTaskId = searchParams.get('roadmapTaskId');

  const { testDetail, loading, error } = useTestDetail(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);
  const { resetPlayer } = useListeningStore();

  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [activeStimulusIdx, setActiveStimulusIdx] = useState(0);
  // Ref to handleComplete so onTimeUp callback always calls the latest version
  const handleCompleteRef = useRef<(() => Promise<void>) | null>(null);
  const notes = useListeningStore((s) => s.notes);
  const isPlaying = useListeningStore((s) => s.isPlaying);
  const progressKey = `practice-progress-${id}`;
  const modeParam = searchParams.get('mode');
  const isExamMode = modeParam === 'exam';

  // Exam session hook (only active in exam mode)
  const examSession = useExamSession(Number(id), isExamMode);

  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    if (typeof window === 'undefined' || isExamMode) return {};
    try {
      const saved = sessionStorage.getItem(progressKey);
      return saved ? JSON.parse(saved).answers ?? {} : {};
    } catch { return {}; }
  });
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>(() => {
    if (typeof window === 'undefined' || isExamMode) return {};
    try {
      const saved = sessionStorage.getItem(progressKey);
      return saved ? JSON.parse(saved).textAnswers ?? {} : {};
    } catch { return {}; }
  });

  const testDuration = testDetail?.duration ?? 0;

  const elapsedTimer = useElapsedTimer(submitted || isExamMode);
  const countdownTimer = useCountdownTimer(
    testDuration > 0 ? testDuration : 60,
    submitted || !isExamMode,
    () => {
      if (!submitted && handleCompleteRef.current) {
        toast('Hết giờ — bài đã được nộp tự động');
        handleCompleteRef.current();
      }
    },
    isExamMode && examSession.session ? examSession.session.remainingSeconds : undefined,
  );

  const elapsed = isExamMode ? countdownTimer.elapsed : elapsedTimer.elapsed;
  const elapsedTime = isExamMode ? countdownTimer.formatted : elapsedTimer.formatted;

  useEffect(() => { resetPlayer(); }, [resetPlayer]);

  // Restore answers from server on resume (exam mode)
  useEffect(() => {
    if (!isExamMode || !examSession.isResuming || !examSession.session?.savedAnswers) return;
    const { answers: saved, textAnswers: savedText } = parseSavedAnswers(examSession.session.savedAnswers);
    if (Object.keys(saved).length > 0) setAnswers(prev => ({ ...saved, ...prev }));
    if (Object.keys(savedText).length > 0) setTextAnswers(prev => ({ ...savedText, ...prev }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examSession.isResuming, examSession.session?.savedAnswers?.length]);

  // Sync answers to exam hook refs (for auto-save)
  useEffect(() => {
    if (!isExamMode) return;
    examSession.syncAnswers(answers, textAnswers);
  }, [answers, textAnswers, isExamMode, examSession]);

  // Auto-save progress to sessionStorage (practice mode only)
  useEffect(() => {
    if (submitted || isExamMode) return;
    sessionStorage.setItem(progressKey, JSON.stringify({ answers, textAnswers }));
  }, [answers, textAnswers, submitted, progressKey, isExamMode]);

  // Handle EXPIRED exam session
  useEffect(() => {
    if (!submitted && isExamMode && examSession.session?.status === 'EXPIRED') {
      router.push(`/practice/listening/${id}/result`);
    }
  }, [isExamMode, examSession.session?.status, id, router, submitted]);

  const stimuli = useMemo(() => testDetail?.stimuli ?? [], [testDetail?.stimuli]);
  const currentStimulus = stimuli[activeStimulusIdx];
  const questionIds = useMemo(() => {
    if (!currentStimulus) return [];
    return currentStimulus.questionGroups.flatMap((g) => g.questions.map((q) => q.id));
  }, [currentStimulus]);
  const totalQuestionIds = useMemo(
    () => stimuli.flatMap((s) => s.questionGroups.flatMap((g) => g.questions.map((q) => q.id))),
    [stimuli]
  );
  const questionCount = totalQuestionIds.length;
  const answeredSet = useMemo(() => {
    const s = new Set<number>();
    for (const [k, v] of Object.entries(answers)) {
      if (v !== 0) s.add(Number(k));
    }
    return s;
  }, [answers]);

  const totalAnsweredCount = totalQuestionIds.filter((qId) => {
    const hasOption = answers[qId] != null && answers[qId] !== 0;
    const hasText = (textAnswers[qId] ?? '').trim() !== '';
    return hasOption || hasText;
  }).length;
  const unansweredCount = questionCount - totalAnsweredCount;

  const handleAnswer = (questionId: number, optionId: number) => {
    if (optionId === 0) {
      setAnswers((prev) => { const next = { ...prev }; delete next[questionId]; return next; });
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    }
  };

  const handleTextAnswer = (questionId: number, text: string) => {
    setTextAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleComplete = async () => {
    if (submitted) return; // guard against double-submit
    setSubmitted(true);
    setConfirmOpen(false);
    markCompleted(id);

    // --- Exam mode: submit via exam session ---
    if (isExamMode && examSession.session) {
      try {
        const res = await examSession.submit();
        sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({
          attemptId: res.attemptId, testId: id, answers, textAnswers,
          elapsedSeconds: countdownTimer.elapsed,
        }));
      } catch {
        sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({
          testId: id, answers, textAnswers, elapsedSeconds: countdownTimer.elapsed,
        }));
      }
      if (roadmapTaskId) updateTaskStatus(Number(roadmapTaskId), 'DONE').catch(() => {});
      router.push(`/practice/listening/${id}/result`);
      return;
    }

    // --- Practice mode: existing flow ---
    sessionStorage.removeItem(progressKey);
    if (currentStimulus) {
      const optionAnswers = Object.entries(answers).map(([qId, optId]) => ({
        questionId: Number(qId), selectedOptionId: optId,
      }));
      const textAnswerList = Object.entries(textAnswers)
        .filter(([, text]) => text.trim() !== '')
        .map(([qId, text]) => ({ questionId: Number(qId), answerText: text }));
      const answerList = [...optionAnswers, ...textAnswerList];
      try {
        const res = await submitAttempt({ testId: Number(id), stimulusId: currentStimulus.id, elapsedSeconds: elapsed, answers: answerList });
        sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({ attemptId: res.attemptId, testId: id, answers, textAnswers, elapsedSeconds: elapsed }));
      } catch {
        sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({ testId: id, answers, textAnswers, elapsedSeconds: elapsed }));
      }
    } else {
      sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({ testId: id, answers, textAnswers, elapsedSeconds: elapsed }));
    }
    if (roadmapTaskId) {
      updateTaskStatus(Number(roadmapTaskId), 'DONE').catch(() => {});
    }

    router.push(`/practice/listening/${id}/result`);
  };
  // Keep ref in sync so onTimeUp always has the latest handleComplete
  handleCompleteRef.current = handleComplete;

  if (loading || (isExamMode && examSession.loading)) return <SkeletonPractice />;

  if (error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-5 bg-gradient-to-b from-orange-50/40 via-white to-white">
        <div className="rounded-3xl bg-white border border-gray-200 shadow-lg p-8 text-center max-w-sm">
          <p className="text-red-400 font-medium mb-3">{error || 'Không tìm thấy bài tập.'}</p>
          <Link href="/practice?skill=listening">
            <Button variant="outline" className="rounded-full">Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {isExamMode ? (
        <ListeningExamView
          stimuli={stimuli}
          answers={answers}
          textAnswers={textAnswers}
          onAnswer={handleAnswer}
          onTextAnswer={handleTextAnswer}
          onSubmit={() => setConfirmOpen(true)}
          submitted={submitted}
          isPlaying={isPlaying}
          elapsedTime={elapsedTime}
        />
      ) : (
        <ListeningPracticeView
          stimuli={stimuli}
          answers={answers}
          textAnswers={textAnswers}
          onAnswer={handleAnswer}
          onTextAnswer={handleTextAnswer}
          onSubmit={() => setConfirmOpen(true)}
          submitted={submitted}
          isPlaying={isPlaying}
          elapsedTime={elapsedTime}
        />
      )}

      {/* Shared Confirm Dialogs (only for practice mode) */}
      {!isExamMode && (
        <>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Hoàn thành bài tập?"
            description={
              unansweredCount > 0
                ? `Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc muốn nộp bài?`
                : 'Sau khi hoàn thành, bạn sẽ xem được đáp án đúng và giải thích cho từng câu hỏi.'
            }
            variant={unansweredCount > 0 ? 'destructive' : 'default'}
            confirmText="Hoàn thành"
            onConfirm={handleComplete}
          />
          <ConfirmDialog
            open={exitOpen}
            onOpenChange={setExitOpen}
            title="Thoát khỏi bài làm?"
            description="Bạn đang thoát khỏi phần làm bài, bạn có chắc chắn muốn thoát không?"
            cancelText="Quay lại làm bài"
            confirmText="Thoát"
            variant="destructive"
            onConfirm={() => router.push('/practice?skill=listening')}
          />
        </>
      )}

      {/* Exam mode confirm dialogs */}
      {isExamMode && (
        <>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Nộp bài?"
            description={
              unansweredCount > 0
                ? `Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc muốn nộp bài?`
                : 'Bạn có chắc chắn muốn nộp bài?'
            }
            variant={unansweredCount > 0 ? 'destructive' : 'default'}
            confirmText="Nộp bài"
            onConfirm={handleComplete}
          />
          <ConfirmDialog
            open={exitOpen}
            onOpenChange={setExitOpen}
            title="Tạm thời thoát?"
            description="Bài làm của bạn đã được lưu tự động. Bạn có thể quay lại tiếp tục bất cứ lúc nào trước khi hết giờ."
            cancelText="Quay lại làm bài"
            confirmText="Thoát"
            variant="default"
            onConfirm={() => router.push('/practice?skill=listening')}
          />
        </>
      )}
    </>
  );
}
