'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Clock } from 'lucide-react';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReadingToolbar } from '@/components/reading/reading-toolbar';
import { ReadingPassage } from '@/components/reading/reading-passage';
import { ReadingPassageWithMatching } from '@/components/reading/reading-passage-with-matching';
import { ReadingQuestionsPanel } from '@/components/reading/reading-questions-panel';
import { ReadingQuestionNav } from '@/components/reading/reading-question-nav';
import { usePracticeStore } from '@/store/practice-store';
import { useReadingStore } from '@/store/reading-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { useCountdownTimer } from '@/hooks/use-countdown-timer';
import { useExamSession } from '@/hooks/use-exam-session';
import { submitAttempt } from '@/lib/practice-api';
import { updateTaskStatus } from '@/lib/roadmap-api';
import type { SavedAnswer } from '@/lib/exam-api';

const FALLBACK_PASSAGE = {
  title: 'Bài đọc',
  content: 'Nội dung bài đọc đang được tải. Vui lòng thử lại sau.',
};

function parseSavedAnswers(savedAnswers: SavedAnswer[]) {
  const answers: Record<number, number> = {};
  const textAnswers: Record<number, string> = {};
  for (const sa of savedAnswers) {
    if (sa.selectedOptionId) answers[sa.questionId] = sa.selectedOptionId;
    if (sa.answerText) textAnswers[sa.questionId] = sa.answerText;
  }
  return { answers, textAnswers };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ReadingExercisePage({ params }: Props) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const roadmapTaskId = searchParams.get('roadmapTaskId');
  const router = useRouter();

  const { testDetail, loading, error } = useTestDetail(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);
  const { setMode, clearAll } = useReadingStore();
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  // Ref to handleComplete so onTimeUp callback always calls the latest version
  const handleCompleteRef = useRef<(() => Promise<void>) | null>(null);
  const progressKey = `practice-progress-${id}`;
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
  const [selectedPillId, setSelectedPillId] = useState<number | null>(null);
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
  const displayTime = isExamMode ? countdownTimer.formatted : elapsedTimer.formatted;
  const isCountingDown = isExamMode && testDuration > 0;

  useEffect(() => {
    if (modeParam === 'exam' || modeParam === 'practice') setMode(modeParam);
    clearAll();
  }, [modeParam, setMode, clearAll]);

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
    if (isExamMode && examSession.session?.status === 'EXPIRED') {
      router.push(`/practice/reading/${id}/result`);
    }
  }, [isExamMode, examSession.session?.status, id, router]);

  const handleAnswer = (questionId: number, optionId: number) => {
    if (optionId === 0) {
      setAnswers(prev => { const next = { ...prev }; delete next[questionId]; return next; });
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: optionId }));
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
      router.push(`/practice/reading/${id}/result`);
      return;
    }

    // --- Practice mode: existing flow ---
    sessionStorage.removeItem(progressKey);
    if (stimuli) {
      const optionAnswers = Object.entries(answers).map(([qId, optId]) => ({
        questionId: Number(qId),
        selectedOptionId: optId,
      }));
      const textAnswerList = Object.entries(textAnswers)
        .filter(([, text]) => text.trim() !== '')
        .map(([qId, text]) => ({ questionId: Number(qId), answerText: text }));
      const answerList = [...optionAnswers, ...textAnswerList];
      try {
        const res = await submitAttempt({
          testId: Number(id),
          stimulusId: stimuli.id,
          elapsedSeconds: elapsed,
          answers: answerList,
        });
        sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({
          attemptId: res.attemptId, testId: id, answers, textAnswers, elapsedSeconds: elapsed,
        }));
      } catch {
        sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({
          testId: id, answers, textAnswers, elapsedSeconds: elapsed,
        }));
      }
    } else {
      sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({
        testId: id, answers, textAnswers, elapsedSeconds: elapsed,
      }));
    }

    if (roadmapTaskId) {
      updateTaskStatus(Number(roadmapTaskId), 'DONE').catch(() => {});
    }

    router.push(`/practice/reading/${id}/result`);
  };
  // Keep ref in sync so onTimeUp always has the latest handleComplete
  handleCompleteRef.current = handleComplete;

  if (loading || (isExamMode && examSession.loading)) {
    return <SkeletonPractice />;
  }

  if (error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice?skill=reading"><Button variant="outline">Quay lại danh sách</Button></Link>
      </div>
    );
  }

  const stimuli = testDetail.stimuli[0];
  const passage = stimuli?.content
    ? { title: testDetail.title, content: stimuli.content }
    : FALLBACK_PASSAGE;
  const questionCount = stimuli?.questionGroups?.reduce((sum, g) => sum + g.questions.length, 0) ?? 0;

  const answeredCount = Object.keys(answers).length + Object.values(textAnswers).filter(t => t.trim() !== '').length;
  const unansweredCount = questionCount - answeredCount;

  const answeredQuestionIds = new Set<number>([
    ...Object.keys(answers).map(Number),
    ...Object.entries(textAnswers).filter(([, t]) => t.trim() !== '').map(([k]) => Number(k)),
  ]);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {submitted ? (
            <Link href="/practice?skill=reading">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setExitOpen(true)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{testDetail.title}</h1>
              {submitted && <Badge className="bg-green-100 text-green-700 border-green-300">Đã hoàn thành</Badge>}
              {isExamMode && examSession.isResuming && !submitted && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">Đang tiếp tục...</Badge>
              )}
              {isExamMode && examSession.saving && !submitted && (
                <Badge variant="outline" className="text-gray-400 border-gray-200 text-[10px]">Đang lưu...</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {questionCount > 0 && <span>{questionCount} câu hỏi</span>}
              <span className={`flex items-center gap-1 font-mono tabular-nums ${submitted ? 'text-green-600' : isCountingDown && countdownTimer.remaining < 60 ? 'text-red-600 animate-pulse' : isCountingDown ? 'text-orange-600' : ''}`}>
                <Clock className="h-3.5 w-3.5" />
                {displayTime}
                {isCountingDown && !submitted && <span className="text-[10px] font-normal ml-1">⏱</span>}
              </span>
            </div>
          </div>
        </div>
        {!submitted ? (
          <Button onClick={() => setConfirmOpen(true)}>Hoàn thành</Button>
        ) : (
          <Link href="/practice?skill=reading"><Button variant="outline">Quay lại danh sách</Button></Link>
        )}
      </div>

      {!submitted && <ReadingToolbar />}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 overflow-y-auto p-6 border-r border-gray-200">
          <h2 className="text-2xl font-bold mb-6">{passage.title}</h2>
          {(() => {
            const matchingGroup = stimuli?.questionGroups?.find(g => g.questionTypeCode === 'MATCHING_HEADINGS');
            return matchingGroup ? (
              <ReadingPassageWithMatching
                content={passage.content}
                questions={matchingGroup.questions}
                answers={answers}
                submitted={submitted}
                onAnswer={handleAnswer}
                selectedPillId={selectedPillId}
                onPillAssigned={() => setSelectedPillId(null)}
              />
            ) : (
              <ReadingPassage content={passage.content} />
            );
          })()}
        </div>
        <div className="w-1/2 overflow-y-auto p-6">
          {stimuli && stimuli.questionGroups.length > 0 ? (
            <ReadingQuestionsPanel
              stimulus={stimuli}
              submitted={submitted}
              answers={answers}
              onAnswer={handleAnswer}
              textAnswers={textAnswers}
              onTextAnswer={handleTextAnswer}
              selectedPillId={selectedPillId}
              onPillSelect={setSelectedPillId}
            />
          ) : (
            <p className="text-gray-400 text-center py-8">Chưa có câu hỏi</p>
          )}
        </div>
      </div>

      {stimuli && stimuli.questionGroups.length > 0 && (
        <ReadingQuestionNav
          questionGroups={stimuli.questionGroups}
          answeredQuestions={answeredQuestionIds}
          submitted={submitted}
          onSubmit={() => setConfirmOpen(true)}
        />
      )}

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
        title={isExamMode ? 'Tạm thời thoát?' : 'Thoát khỏi bài làm'}
        description={
          isExamMode
            ? 'Bài làm của bạn đã được lưu tự động. Bạn có thể quay lại tiếp tục bất cứ lúc nào trước khi hết giờ.'
            : 'Bạn ơi, bạn đang thoát khỏi phần làm bài, bạn có chắc chắn muốn thoát chứ'
        }
        cancelText="Quay lại làm bài"
        confirmText="Thoát"
        variant={isExamMode ? 'default' : 'destructive'}
        onConfirm={() => router.push('/practice?skill=reading')}
      />
    </div>
  );
}
