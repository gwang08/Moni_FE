'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReadingToolbar } from '@/components/reading/reading-toolbar';
import { ReadingPassage } from '@/components/reading/reading-passage';
import { ReadingQuestionsPanel } from '@/components/reading/reading-questions-panel';
import { usePracticeStore } from '@/store/practice-store';
import { useReadingStore } from '@/store/reading-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { submitAttempt } from '@/lib/practice-api';

const FALLBACK_PASSAGE = {
  title: 'Bài đọc',
  content: 'Nội dung bài đọc đang được tải. Vui lòng thử lại sau.',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function ReadingExercisePage({ params }: Props) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const router = useRouter();

  const { testDetail, loading, error } = useTestDetail(id);
  const markCompleted = usePracticeStore((state) => state.markCompleted);
  const { setMode, clearAll } = useReadingStore();
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const { elapsed, formatted: elapsedTime } = useElapsedTimer(submitted);

  useEffect(() => {
    if (modeParam === 'exam' || modeParam === 'practice') setMode(modeParam);
    clearAll();
  }, [modeParam, setMode, clearAll]);

  const handleAnswer = (questionId: number, optionId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleComplete = () => {
    const resultData = { testId: id, answers, elapsedSeconds: elapsed };
    sessionStorage.setItem(`practice-result-${id}`, JSON.stringify(resultData));
    setSubmitted(true);
    setConfirmOpen(false);
    markCompleted(id);

    // Submit to backend (fire-and-forget)
    if (stimuli) {
      const answerList = Object.entries(answers).map(([qId, optId]) => ({
        questionId: Number(qId),
        selectedOptionId: optId,
      }));
      submitAttempt({
        testId: Number(id),
        stimulusId: stimuli.id,
        elapsedSeconds: elapsed,
        answers: answerList,
      }).catch(() => {}); // silently fail, result page uses local data
    }

    router.push(`/practice/reading/${id}/result`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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

  const stimuli = testDetail.stimuli[0];
  const passage = stimuli?.content
    ? { title: testDetail.title, content: stimuli.content }
    : FALLBACK_PASSAGE;
  const questionCount = stimuli?.questionGroups?.reduce((sum, g) => sum + g.questions.length, 0) ?? 0;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {submitted ? (
            <Link href="/practice">
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
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {questionCount > 0 && <span>{questionCount} câu hỏi</span>}
              <span className={`flex items-center gap-1 font-mono tabular-nums ${submitted ? 'text-green-600' : ''}`}>
                <Clock className="h-3.5 w-3.5" />
                {elapsedTime}
              </span>
            </div>
          </div>
        </div>
        {!submitted ? (
          <Button onClick={() => setConfirmOpen(true)}>Hoàn thành</Button>
        ) : (
          <Link href="/practice"><Button variant="outline">Quay lại danh sách</Button></Link>
        )}
      </div>

      {!submitted && <ReadingToolbar />}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Passage */}
        <div className="w-1/2 overflow-y-auto p-6 border-r border-gray-200">
          <h2 className="text-2xl font-bold mb-6">{passage.title}</h2>
          <ReadingPassage content={passage.content} />
        </div>
        {/* Right: Questions (+ Notes sidebar when active) */}
        <div className="w-1/2 overflow-y-auto p-6">
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
        description="Bạn ơi, bạn đang thoát khỏi phần làm bài, bạn có chắc chắn muốn thoát chứ"
        cancelText="Quay lại làm bài"
        confirmText="Thoát"
        variant="destructive"
        onConfirm={() => router.push('/practice')}
      />
    </div>
  );
}
