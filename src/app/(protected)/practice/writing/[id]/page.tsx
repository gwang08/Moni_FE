'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { WritingPracticeHeader } from '@/components/writing/writing-practice-header';
import { WritingPromptPanel } from '@/components/writing/writing-prompt-panel';
import { WritingEditor } from '@/components/writing/writing-editor';
import { WritingToolbarPanel } from '@/components/writing/writing-toolbar-panel';
import { GradingModal } from '@/components/writing/grading-modal';
import { ScoringDialog } from '@/components/scoring/scoring-dialog';
import { useWritingStore } from '@/store/writing-store';
import { usePracticeStore } from '@/store/practice-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { submitAttempt } from '@/lib/practice-api';
import { useRouter } from 'next/navigation';
import type { WritingTaskType } from '@/types/writing.types';

const FALLBACK_PROMPT = 'Hãy viết một bài luận bày tỏ quan điểm của bạn về chủ đề được đề cập.';

interface Props {
  params: Promise<{ id: string }>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function WritingExercisePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { testDetail, loading, error } = useTestDetail(id);

  const {
    content,
    wordCount,
    gradingResult,
    isGrading,
    submitForGrading,
    reset,
  } = useWritingStore();
  const markCompleted = usePracticeStore((state) => state.markCompleted);

  const [showGrading, setShowGrading] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [showScoringDialog, setShowScoringDialog] = useState(false);

  const { elapsed, formatted: elapsedTime } = useElapsedTimer(isGrading);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (isGrading || gradingResult) setShowGrading(true);
  }, [isGrading, gradingResult]);

  if (loading) {
    return <SkeletonPractice />;
  }

  if (error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4 bg-gradient-to-br from-teal-50 via-blue-50/30 to-emerald-50/40">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice?skill=writing">
          <Button variant="outline" className="rounded-full">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  const taskType: WritingTaskType = testDetail.section === 1 ? 1 : 2;
  const stimulus = testDetail.stimuli[0];
  const prompt = stimulus?.content || testDetail.description || FALLBACK_PROMPT;
  const chartImageUrl = taskType === 1 ? (stimulus?.mediaUrl ?? undefined) : undefined;
  const sampleAnswer = stimulus?.questionGroups[0]?.instruction || undefined;

  const canGrade = wordCount > 0 && !isGrading;

  const handleGrade = async () => {
    const answer = stripHtml(content);
    // Fetch chart image as File for Task 1
    let chartFile: File | undefined;
    if (taskType === 1 && chartImageUrl) {
      try {
        const res = await fetch(chartImageUrl);
        const blob = await res.blob();
        const ext = chartImageUrl.split('.').pop()?.split('?')[0] || 'png';
        chartFile = new File([blob], `chart.${ext}`, { type: blob.type || 'image/png' });
      } catch { /* proceed without chart */ }
    }
    await submitForGrading({
      taskType,
      question: prompt,
      answer,
      chartImage: chartFile,
    });
    markCompleted(id);
    // Submit attempt to track in practice history
    if (stimulus) {
      try {
        await submitAttempt({
          testId: Number(id),
          stimulusId: stimulus.id,
          elapsedSeconds: elapsed,
          answers: [{ questionId: stimulus.questionGroups[0]?.questions[0]?.id ?? 0, answerText: answer }],
        });
      } catch { /* ignore - grading already done */ }
    }
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col relative overflow-hidden">
      {/* Decorative pastel blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-teal-200/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-72 h-72 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 w-64 h-64 rounded-full bg-emerald-200/15 blur-3xl" />

      <WritingPracticeHeader
        title={testDetail.title}
        taskType={taskType}
        elapsedTime={elapsedTime}
        isGrading={isGrading}
        canGrade={canGrade}
        onGrade={() => setShowScoringDialog(true)}
        onExit={() => setExitOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-teal-50/50 via-white to-blue-50/30 relative z-10">
        {/* Left: Prompt */}
        <div className="w-[28%] overflow-y-auto p-4">
          <WritingPromptPanel
            prompt={prompt}
            chartImageUrl={chartImageUrl}
            taskType={taskType}
          />
        </div>

        {/* Center: Editor */}
        <div className="flex-1 overflow-y-auto">
          <WritingEditor
            taskType={taskType}
            sampleAnswer={sampleAnswer}
            showSample={showSample}
            onToggleSample={() => setShowSample(v => !v)}
          />
        </div>

        {/* Right: Toolbar */}
        <div className="w-[24%] overflow-y-auto p-4">
          <WritingToolbarPanel
            wordCount={wordCount}
            taskType={taskType}
          />
        </div>
      </div>

      <ScoringDialog
        open={showScoringDialog}
        onClose={() => setShowScoringDialog(false)}
        onAIScore={handleGrade}
        skill="writing"
      />

      <GradingModal
        isOpen={showGrading}
        onClose={() => setShowGrading(false)}
        result={gradingResult}
        isLoading={isGrading}
      />

      <ConfirmDialog
        open={exitOpen}
        onOpenChange={setExitOpen}
        title="Thoát khỏi bài làm?"
        description="Bài viết của bạn sẽ không được lưu lại. Bạn có chắc chắn muốn thoát?"
        confirmText="Thoát"
        cancelText="Quay lại làm bài"
        variant="destructive"
        onConfirm={() => router.push('/practice?skill=writing')}
      />
    </div>
  );
}
