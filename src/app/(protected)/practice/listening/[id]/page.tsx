'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { ListeningPracticeHeader } from '@/components/listening/listening-practice-header';
import { ListeningAudioPlayer } from '@/components/listening/listening-audio-player';
import { ListeningQuestionNav } from '@/components/listening/listening-question-nav';
import { ListeningNotesSidebar } from '@/components/listening/listening-notes-sidebar';
import { ReadingQuestionsPanel } from '@/components/reading/reading-questions-panel';
import { useListeningStore } from '@/store/listening-store';
import { usePracticeStore } from '@/store/practice-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { submitAttempt } from '@/lib/practice-api';
import { updateTaskStatus } from '@/lib/roadmap-api';

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
  const notes = useListeningStore((s) => s.notes);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const { elapsed, formatted: elapsedTime } = useElapsedTimer(submitted);

  useEffect(() => { resetPlayer(); }, [resetPlayer]);

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

  const handleTextAnswer = (questionId: number, text: string) => {
    setTextAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleComplete = async () => {
    setConfirmOpen(false);
    markCompleted(id);
    if (stimuli) {
      const optionAnswers = Object.entries(answers).map(([qId, optId]) => ({
        questionId: Number(qId), selectedOptionId: optId,
      }));
      const textAnswerList = Object.entries(textAnswers)
        .filter(([, text]) => text.trim() !== '')
        .map(([qId, text]) => ({ questionId: Number(qId), answerText: text }));
      const answerList = [...optionAnswers, ...textAnswerList];
      try {
        const res = await submitAttempt({ testId: Number(id), stimulusId: stimuli.id, elapsedSeconds: elapsed, answers: answerList });
        sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({ attemptId: res.attemptId, testId: id, answers, textAnswers, elapsedSeconds: elapsed }));
      } catch {
        sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({ testId: id, answers, textAnswers, elapsedSeconds: elapsed }));
      }
    } else {
      sessionStorage.setItem(`practice-result-${id}`, JSON.stringify({ testId: id, answers, textAnswers, elapsedSeconds: elapsed }));
    }
    // Mark roadmap task as DONE if navigated from roadmap
    if (roadmapTaskId) {
      updateTaskStatus(Number(roadmapTaskId), 'DONE').catch(() => {});
    }

    router.push(`/practice/listening/${id}/result`);
  };

  if (loading) return <SkeletonPractice />;

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
    <div className="h-[calc(100vh-56px)] flex flex-col bg-white">
      {/* Top header: X + timer + title */}
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

      {/* Notes toggle */}
      <div className="flex justify-end px-4 py-1 border-b bg-gray-50/50">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setNotesOpen((v) => !v)}
        >
          <StickyNote className="h-3.5 w-3.5" />
          Ghi chú ({notes.length})
        </Button>
      </div>

      {/* Main content: scrollable questions */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {stimuli && stimuli.questionGroups.length > 0 ? (
            <ReadingQuestionsPanel
              stimulus={stimuli}
              submitted={submitted}
              answers={answers}
              onAnswer={handleAnswer}
              textAnswers={textAnswers}
              onTextAnswer={handleTextAnswer}
            />
          ) : (
            <p className="text-gray-400 text-center py-8">Chưa có câu hỏi</p>
          )}
        </div>
      </div>

      {/* Bottom: Audio player */}
      {stimuli?.mediaUrl && (
        <ListeningAudioPlayer audioUrl={stimuli.mediaUrl} />
      )}

      {/* Bottom bar: question nav + submit */}
      <ListeningQuestionNav
        totalQuestions={questionCount}
        answeredQuestions={answeredSet}
        questionIds={questionIds}
        submitted={submitted}
        onSubmit={() => setConfirmOpen(true)}
      />

      <ListeningNotesSidebar open={notesOpen} onOpenChange={setNotesOpen} />

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
        title="Thoát khỏi bài làm?"
        description="Bạn đang thoát khỏi phần làm bài, bạn có chắc chắn muốn thoát không?"
        cancelText="Quay lại làm bài"
        confirmText="Thoát"
        variant="destructive"
        onConfirm={() => router.push('/practice?skill=listening')}
      />
    </div>
  );
}
