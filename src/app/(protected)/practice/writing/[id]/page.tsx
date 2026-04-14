'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { WritingPracticeView } from '@/components/writing/writing-practice-view';
import { WritingExamView } from '@/components/writing/writing-exam-view';
import { WritingScoringProgressDialog } from '@/components/writing/writing-scoring-progress-dialog';
import { WritingScoringOptionsDialog } from '@/components/writing/writing-scoring-options-dialog';
import { WritingExpertSelectionDialog } from '@/components/writing/writing-expert-selection-dialog';
import { getServices } from '@/lib/payment-api';
import { useWritingStore } from '@/store/writing-store';
import { usePracticeStore } from '@/store/practice-store';
import { useAuthStore } from '@/store/auth-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { useCountdownTimer } from '@/hooks/use-countdown-timer';
import { toMinutes } from '@/lib/duration-utils';
import { useExamSession } from '@/hooks/use-exam-session';
import { submitWriting } from '@/lib/ai-api';
import type { WritingTaskType } from '@/types/writing.types';

const FALLBACK_PROMPT = 'Hãy viết một bài luận bày tỏ quan điểm của bạn về chủ đề được đề cập.';

interface Props {
  params: Promise<{ id: string }>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function draftKey(testId: string) {
  return `writing-draft-${testId}`;
}

interface WritingDraft {
  content: string;
  wordCount: number;
  elapsed: number;
}

export default function WritingExercisePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExamMode = searchParams.get('mode') === 'exam';
  const { testDetail, loading, error } = useTestDetail(id);

  const {
    content,
    wordCount,
    isGrading,
    submitForGrading,
    reset,
    setContent,
  } = useWritingStore();
  const markCompleted = usePracticeStore((state) => state.markCompleted);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  const [exitOpen, setExitOpen] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [showScoringDialog, setShowScoringDialog] = useState(false);
  const [aiCost, setAiCost] = useState<number | null>(null);
  const [expertCost, setExpertCost] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [showExpertDialog, setShowExpertDialog] = useState(false);

  const handleSubmitRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // ===== ALL HOOKS BEFORE ANY EARLY RETURN =====

  const { elapsed, formatted: elapsedTime } = useElapsedTimer(isGrading || isExamMode);

  const examSession = useExamSession(Number(id), isExamMode);
  const countdownTimer = useCountdownTimer(
    testDetail?.duration && testDetail.duration > 0 ? toMinutes(testDetail.duration) : 60,
    submitted || !isExamMode,
    () => {
      if (!submitted && handleSubmitRef.current) {
        toast('Hết giờ — bài đã được nộp tự động');
        handleSubmitRef.current();
      }
    },
    isExamMode && examSession.session ? examSession.session.remainingSeconds : undefined,
  );

  // Handle EXPIRED exam session
  useEffect(() => {
    if (isExamMode && examSession.session?.status === 'EXPIRED') {
      router.push(`/practice/writing/${id}/review`);
    }
  }, [isExamMode, examSession.session?.status, id, router]);

  // On mount: reset store + fetch service costs
  useEffect(() => {
    reset();
    getServices()
      .then((services) => {
        setAiCost(services.find((s) => s.serviceCode === 'AI_WRITING_SCORE')?.creditCost ?? null);
        setExpertCost(services.find((s) => s.serviceCode === 'EXPERT_WRITING_SCORE')?.creditCost ?? null);
      })
      .catch(() => {});
  }, [reset]);

  // Check draft
  useEffect(() => {
    if (!testDetail) return;
    const raw = localStorage.getItem(draftKey(id));
    if (!raw) return;
    try {
      const draft: WritingDraft = JSON.parse(raw);
      if (draft.content) {
        setContent(draft.content);
      }
    } catch {
      localStorage.removeItem(draftKey(id));
    }
  }, [testDetail, id, setContent]);

  // Auto-save draft
  useEffect(() => {
    if (submitted) return;
    if (!content && wordCount === 0) return;
    localStorage.setItem(draftKey(id), JSON.stringify({ content, wordCount, elapsed }));
  }, [content, wordCount, elapsed, id, submitted]);

  // Submit handler (useCallback so it's a hook, placed before early returns)
  const handleSubmit = useCallback(() => {
    const stimulus = testDetail?.stimuli[0];
    if (!stimulus || isSubmitting || submitted || !testDetail) return Promise.resolve();
    setIsSubmitting(true);
    const taskType: WritingTaskType = testDetail.section === 1 ? 1 : 2;
    return submitWriting({
      testId: Number(id),
      stimulusId: stimulus.id,
      taskType,
      essayContent: stripHtml(content),
      wordCount,
    })
      .then((result) => {
        setSubmissionId(result.submissionId);
        localStorage.removeItem(draftKey(id));
        markCompleted(id);
        setSubmitted(true);
        setShowScoringDialog(true);
      })
      .catch(() => {
        toast.error('Nộp bài thất bại', { description: 'Vui lòng thử lại.' });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [testDetail, isSubmitting, submitted, content, wordCount, id, markCompleted]);

  // Sync ref
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Grade handler
  const handleGrade = useCallback(() => {
    const stimulus = testDetail?.stimuli[0];
    if (!testDetail || !stimulus) return;
    const taskType: WritingTaskType = testDetail.section === 1 ? 1 : 2;
    const prompt = stimulus.content || testDetail.description || FALLBACK_PROMPT;
    const answer = stripHtml(content);
    const scoringChartUrl = stimulus.mediaUrl || stimulus.content?.match(/<img[^>]+src="([^"]+)"/)?.[1];
    let chartFile: File | undefined;
    if (taskType === 1 && scoringChartUrl) {
      fetch(scoringChartUrl)
        .then((res) => res.blob())
        .then((blob) => {
          chartFile = new File([blob], 'chart.png', { type: blob.type || 'image/png' });
          console.log('[Writing Score] Chart image fetched:', chartFile.size, 'bytes');
        })
        .catch((err) => { console.error('[Writing Score] Chart fetch failed:', err, 'URL:', scoringChartUrl); })
        .finally(() => {
          submitForGrading({
            taskType, question: prompt, answer, chartImage: chartFile,
            stimulusId: stimulus.id, submissionId: submissionId ?? undefined,
          }).then(() => { refreshProfile(); if (submissionId) router.push(`/writing/result/${submissionId}`); });
        });
    } else {
      submitForGrading({
        taskType, question: prompt, answer,
        stimulusId: stimulus.id, submissionId: submissionId ?? undefined,
      }).then(() => { refreshProfile(); if (submissionId) router.push(`/writing/result/${submissionId}`); });
    }
  }, [testDetail, content, submissionId, submitForGrading, refreshProfile, router]);

  // ===== EARLY RETURNS AFTER ALL HOOKS =====

  if (loading) return <SkeletonPractice />;

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

  // Derived values
  const taskType: WritingTaskType = testDetail.section === 1 ? 1 : 2;
  const stimulus = testDetail.stimuli[0];
  const prompt = stimulus?.content || testDetail.description || FALLBACK_PROMPT;
  const chartImageUrl = taskType === 1 ? (stimulus?.mediaUrl ?? undefined) : undefined;
  const sampleAnswer = stimulus?.questionGroups[0]?.instruction || undefined;
  const canGrade = wordCount > 0 && !isGrading && !submitted;

  // Exam loading
  if (isExamMode && examSession.loading) return <SkeletonPractice />;

  // ===== EXAM MODE LAYOUT =====
  if (isExamMode) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <WritingExamView
          prompt={prompt}
          chartImageUrl={chartImageUrl}
          taskType={taskType}
          content={content}
          wordCount={wordCount}
          readOnly={submitted}
          onContentChange={setContent}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitted={submitted}
          countdownDisplay={countdownTimer.formatted}
          remainingSeconds={countdownTimer.remaining}
          testTitle={testDetail.title}
        />
        <WritingScoringOptionsDialog
          open={showScoringDialog}
          aiCost={aiCost}
          expertCost={expertCost}
          onAIScore={() => { setShowScoringDialog(false); handleGrade(); }}
          onExpertScore={() => { setShowScoringDialog(false); setShowExpertDialog(true); }}
          onSkip={() => { setShowScoringDialog(false); router.push('/scoring-history'); }}
        />
        <WritingExpertSelectionDialog
          open={showExpertDialog}
          onOpenChange={setShowExpertDialog}
          submissionId={submissionId}
          expertCost={expertCost}
        />
        <WritingScoringProgressDialog open={isGrading} />
      </div>
    );
  }

  // ===== PRACTICE MODE LAYOUT =====
  return (
    <>
      <WritingPracticeView
        title={testDetail.title}
        prompt={prompt}
        chartImageUrl={chartImageUrl}
        taskType={taskType}
        content={content}
        wordCount={wordCount}
        sampleAnswer={sampleAnswer}
        showSample={showSample}
        onToggleSample={() => setShowSample(v => !v)}
        onContentChange={setContent}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitted={submitted}
        elapsedTime={elapsedTime}
        onExit={() => setExitOpen(true)}
      />

      <WritingScoringOptionsDialog
        open={showScoringDialog}
        aiCost={aiCost}
        expertCost={expertCost}
        onAIScore={() => { setShowScoringDialog(false); handleGrade(); }}
        onExpertScore={() => { setShowScoringDialog(false); setShowExpertDialog(true); }}
        onSkip={() => { setShowScoringDialog(false); router.push('/scoring-history'); }}
      />
      <WritingExpertSelectionDialog
        open={showExpertDialog}
        onOpenChange={setShowExpertDialog}
        submissionId={submissionId}
        expertCost={expertCost}
      />
      <WritingScoringProgressDialog open={isGrading} />

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
    </>
  );
}
