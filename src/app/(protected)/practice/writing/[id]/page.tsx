'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { WritingPracticeHeader } from '@/components/writing/writing-practice-header';
import { WritingPromptPanel } from '@/components/writing/writing-prompt-panel';
import { WritingEditor } from '@/components/writing/writing-editor';
import { WritingToolbarPanel } from '@/components/writing/writing-toolbar-panel';
import { WritingExamView } from '@/components/writing/writing-exam-view';
import { WritingScoringProgressDialog } from '@/components/writing/writing-scoring-progress-dialog';
import { WritingScoringOptionsDialog } from '@/components/writing/writing-scoring-options-dialog';
import { getServices } from '@/lib/payment-api';
import { useWritingStore } from '@/store/writing-store';
import { usePracticeStore } from '@/store/practice-store';
import { useAuthStore } from '@/store/auth-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { useCountdownTimer } from '@/hooks/use-countdown-timer';
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
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<WritingDraft | null>(null);
  const [restoredContent, setRestoredContent] = useState<string | undefined>(undefined);
  const [editorKey, setEditorKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSubmitRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // ===== ALL HOOKS BEFORE ANY EARLY RETURN =====

  const { elapsed, formatted: elapsedTime } = useElapsedTimer(isGrading || isExamMode);

  const examSession = useExamSession(Number(id), isExamMode);
  const countdownTimer = useCountdownTimer(
    testDetail?.duration && testDetail.duration > 0 ? testDetail.duration : 60,
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
        setPendingDraft(draft);
        setDraftDialogOpen(true);
      }
    } catch {
      localStorage.removeItem(draftKey(id));
    }
  }, [testDetail, id]);

  // Auto-save draft
  useEffect(() => {
    if (submitted) return;
    if (!content && wordCount === 0) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(draftKey(id), JSON.stringify({ content, wordCount, elapsed }));
    }, 1000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
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
        })
        .catch(() => {})
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
          onExpertScore={() => { setShowScoringDialog(false); router.push('/scoring-history'); }}
          onSkip={() => { setShowScoringDialog(false); router.push('/scoring-history'); }}
        />
        <WritingScoringProgressDialog open={isGrading} />
      </div>
    );
  }

  // ===== PRACTICE MODE LAYOUT =====
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50/50 via-white to-blue-50/30">
      <div className="pointer-events-none fixed -top-32 -left-32 w-80 h-80 rounded-full bg-teal-200/20 blur-3xl" />
      <div className="pointer-events-none fixed top-1/3 -right-24 w-72 h-72 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-20 left-1/3 w-64 h-64 rounded-full bg-emerald-200/15 blur-3xl" />

      <WritingPracticeHeader
        title={testDetail.title}
        taskType={taskType}
        elapsedTime={elapsedTime}
        isGrading={isGrading}
        canGrade={canGrade}
        submitted={submitted}
        isSubmitting={isSubmitting}
        onGrade={handleSubmit}
        onExit={() => setExitOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="w-[28%] overflow-y-auto p-4">
          <WritingPromptPanel prompt={prompt} chartImageUrl={chartImageUrl} taskType={taskType} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <WritingEditor
            key={editorKey}
            taskType={taskType}
            sampleAnswer={sampleAnswer}
            showSample={showSample}
            onToggleSample={() => setShowSample(v => !v)}
            readOnly={submitted}
            initialContent={restoredContent}
          />
        </div>
        <div className="w-[24%] overflow-y-auto p-4">
          <WritingToolbarPanel wordCount={wordCount} taskType={taskType} />
        </div>
      </div>

      <WritingScoringOptionsDialog
        open={showScoringDialog}
        aiCost={aiCost}
        expertCost={expertCost}
        onAIScore={() => { setShowScoringDialog(false); handleGrade(); }}
        onExpertScore={() => { setShowScoringDialog(false); router.push('/scoring-history'); }}
        onSkip={() => { setShowScoringDialog(false); router.push('/scoring-history'); }}
      />
      <WritingScoringProgressDialog open={isGrading} />

      <ConfirmDialog
        open={draftDialogOpen}
        onOpenChange={setDraftDialogOpen}
        title="Bạn có bài chưa nộp"
        description="Bạn muốn tiếp tục bài viết trước đó hay bắt đầu lại?"
        confirmText="Tiếp tục"
        cancelText="Làm mới"
        onConfirm={() => {
          if (pendingDraft) {
            setContent(pendingDraft.content);
            setRestoredContent(pendingDraft.content);
            setEditorKey(k => k + 1);
          }
          setPendingDraft(null);
          setDraftDialogOpen(false);
        }}
        onCancel={() => {
          localStorage.removeItem(draftKey(id));
          setPendingDraft(null);
          setDraftDialogOpen(false);
        }}
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
