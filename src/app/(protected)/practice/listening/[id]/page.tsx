'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListeningPracticeHeader } from '@/components/listening/listening-practice-header';
import { ListeningAudioPlayer } from '@/components/listening/listening-audio-player';
import { ListeningQuestionNav } from '@/components/listening/listening-question-nav';
import { ReadingQuestionsPanel } from '@/components/reading/reading-questions-panel';
import { useListeningStore } from '@/store/listening-store';
import { usePracticeStore } from '@/store/practice-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { submitAttempt } from '@/lib/practice-api';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ListeningExercisePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { testDetail, loading, error } = useTestDetail(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);
  const { resetPlayer } = useListeningStore();

  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const { elapsed, formatted: elapsedTime } = useElapsedTimer(submitted);

  useEffect(() => {
    resetPlayer();
  }, [resetPlayer]);

  const stimuli = testDetail?.stimuli[0];

  const questionIds = useMemo(() => {
    if (!stimuli) return [];
    return stimuli.questionGroups.flatMap((g) => g.questions.map((q) => q.id));
  }, [stimuli]);

  const questionCount = questionIds.length;

  const answeredSet = useMemo(() => {
    const s = new Set<number>();
    for (const [k, v] of Object.entries(answers)) {
      if (v !== 0) s.add(Number(k));
    }
    return s;
  }, [answers]);

  const handleAnswer = (questionId: number, optionId: number) => {
    if (optionId === 0) {
      setAnswers((prev) => { const next = { ...prev }; delete next[questionId]; return next; });
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    }
  };

  const handleComplete = async () => {
    setSubmitted(true);
    setConfirmOpen(false);
    markCompleted(id);

    if (stimuli) {
      const answerList = Object.entries(answers).map(([qId, optId]) => ({
        questionId: Number(qId),
        selectedOptionId: optId,
      }));
      try {
        const res = await submitAttempt({
          testId: Number(id),
          stimulusId: stimuli.id,
          elapsedSeconds: elapsed,
          answers: answerList,
        });
        sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({
          attemptId: res.attemptId, testId: id, answers, elapsedSeconds: elapsed,
        }));
      } catch {
        sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({
          testId: id, answers, elapsedSeconds: elapsed,
        }));
      }
    } else {
      sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({
        testId: id, answers, elapsedSeconds: elapsed,
      }));
    }

    router.push(`/practice/listening/${id}/result`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        <span className="ml-3 text-gray-600">Đang tải bài tập...</span>
      </div>
    );
  }

  if (error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice"><Button variant="outline">Quay lại danh sách</Button></Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <ListeningPracticeHeader
        title={testDetail.title}
        questionCount={questionCount}
        elapsedTime={elapsedTime}
        submitted={submitted}
        answeredCount={answeredSet.size}
        totalQuestions={questionCount}
        onSubmit={() => setConfirmOpen(true)}
        onExit={() => setExitOpen(true)}
      />

      {stimuli?.mediaUrl && (
        <div className="px-4 pt-3 shrink-0">
          <ListeningAudioPlayer audioUrl={stimuli.mediaUrl} />
        </div>
      )}

      {questionIds.length > 0 && (
        <ListeningQuestionNav
          totalQuestions={questionCount}
          answeredQuestions={answeredSet}
          questionIds={questionIds}
        />
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {stimuli && stimuli.questionGroups.length > 0 ? (
          <ReadingQuestionsPanel
            stimulus={stimuli}
            submitted={submitted}
            answers={answers}
            onAnswer={handleAnswer}
          />
        ) : (
          <p className="text-gray-400 text-center py-8">Chưa có câu hỏi</p>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hoàn thành bài tập?"
        description="Sau khi hoàn thành, bạn sẽ xem được đáp án đúng và giải thích cho từng câu hỏi."
        confirmText="Hoàn thành"
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={exitOpen}
        onOpenChange={setExitOpen}
        title="Thoát khỏi bài làm"
        description="Bạn đang thoát khỏi phần làm bài, bạn có chắc chắn muốn thoát không?"
        cancelText="Quay lại làm bài"
        confirmText="Thoát"
        variant="destructive"
        onConfirm={() => router.push('/practice')}
      />
    </div>
  );
}
