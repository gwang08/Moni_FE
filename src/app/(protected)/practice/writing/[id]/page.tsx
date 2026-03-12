'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { WritingPracticeHeader } from '@/components/writing/writing-practice-header';
import { WritingPromptPanel } from '@/components/writing/writing-prompt-panel';
import { WritingEditor } from '@/components/writing/writing-editor';
import { WritingToolbarPanel } from '@/components/writing/writing-toolbar-panel';
import { GradingModal } from '@/components/writing/grading-modal';
import { useWritingStore } from '@/store/writing-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { useRouter } from 'next/navigation';
import type { WritingTaskType } from '@/types/writing.types';

const FALLBACK_PROMPT = 'Hãy viết một bài luận bày tỏ quan điểm của bạn về chủ đề được đề cập.';
const MIN_WORDS: Record<WritingTaskType, number> = { 1: 150, 2: 250 };

interface Props {
  params: Promise<{ id: string }>;
}

/** Strip HTML tags from editor HTML output to get plain text for API */
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

  const [showGrading, setShowGrading] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [showSample, setShowSample] = useState(false);

  const { formatted: elapsedTime } = useElapsedTimer(isGrading);

  // Reset store on mount to clear previous session
  useEffect(() => {
    reset();
  }, [reset]);

  // Open grading modal when result arrives
  useEffect(() => {
    if (gradingResult) setShowGrading(true);
  }, [gradingResult]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-gray-600">Đang tải bài tập...</span>
      </div>
    );
  }

  if (error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  // Derive task info from test detail
  const taskType: WritingTaskType = testDetail.section === 1 ? 1 : 2;
  const minWords = MIN_WORDS[taskType];
  const stimulus = testDetail.stimuli[0];
  const prompt = stimulus?.content || testDetail.description || FALLBACK_PROMPT;
  // Chart image only relevant for Task 1
  const chartImageUrl = taskType === 1 ? (stimulus?.mediaUrl ?? undefined) : undefined;
  // Sample answer from first question group instruction
  const sampleAnswer = stimulus?.questionGroups[0]?.instruction || undefined;

  const canGrade = wordCount >= minWords && !isGrading;

  const handleGrade = async () => {
    const answer = stripHtml(content);
    await submitForGrading({
      taskType,
      question: prompt,
      answer,
    });
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <WritingPracticeHeader
        title={testDetail.title}
        taskType={taskType}
        wordCount={wordCount}
        minWords={minWords}
        elapsedTime={elapsedTime}
        isGrading={isGrading}
        canGrade={canGrade}
        onGrade={handleGrade}
        onExit={() => setExitOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Prompt */}
        <div className="w-1/4 overflow-y-auto border-r p-4">
          <WritingPromptPanel
            prompt={prompt}
            chartImageUrl={chartImageUrl}
            taskType={taskType}
            minWords={minWords}
          />
        </div>

        {/* Center: Editor */}
        <div className="w-1/2 overflow-y-auto">
          <WritingEditor taskType={taskType} />
        </div>

        {/* Right: Toolbar */}
        <div className="w-1/4 overflow-y-auto border-l p-4">
          <WritingToolbarPanel
            wordCount={wordCount}
            minWords={minWords}
            taskType={taskType}
            sampleAnswer={sampleAnswer}
            showSample={showSample}
            onToggleSample={() => setShowSample((v) => !v)}
          />
        </div>
      </div>

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
        onConfirm={() => router.push('/practice')}
      />
    </div>
  );
}
