'use client';

import { use, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { WritingPracticeView } from '@/components/writing/writing-practice-view';
import { WritingExamView } from '@/components/writing/writing-exam-view';
import { WritingScoringProgressDialog } from '@/components/writing/writing-scoring-progress-dialog';
import { WritingScoringOptionsDialog } from '@/components/writing/writing-scoring-options-dialog';
import { WritingExpertSelectionDialog } from '@/components/writing/writing-expert-selection-dialog';
import { getServices, getServiceQuota, type ServiceQuotaResponse } from '@/lib/payment-api';
import { getMyActiveSubscription } from '@/lib/subscription-api';
import type { UserSubscriptionResponse } from '@/types/subscription.types';
import { useWritingStore } from '@/store/writing-store';
import { usePracticeStore } from '@/store/practice-store';
import { useAuthStore } from '@/store/auth-store';
import { usePaymentStore } from '@/store/payment-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { useCountdownTimer } from '@/hooks/use-countdown-timer';
import { toMinutes } from '@/lib/duration-utils';
import { useExamSession } from '@/hooks/use-exam-session';
import { submitWriting } from '@/lib/ai-api';
import { completeSlot } from '@/lib/roadmap-api';
import type { WritingTaskType } from '@/types/writing.types';

const FALLBACK_PROMPT = 'Hãy viết một bài luận bày tỏ quan điểm của bạn về chủ đề được đề cập.';

interface Props {
  params: Promise<{ id: string }>;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')           // <br> → newline
    .replace(/<\/p>/gi, '\n\n')               // </p> → double newline (paragraph break)
    .replace(/<\/div>/gi, '\n')               // </div> → newline
    .replace(/<[^>]*>/g, '')                  // strip remaining tags
    .replace(/[ \t]+/g, ' ')                  // collapse only horizontal spaces (not \n)
    .replace(/\n{3,}/g, '\n\n')              // limit to max 2 consecutive newlines
    .trim();
}

function draftKey(testId: string) {
  return `writing-draft-${testId}`;
}

interface WritingDraft {
  contents: string[];
  elapsed: number;
}

export default function WritingExercisePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExamMode = searchParams.get('mode') === 'exam';
  const slotId = searchParams.get('slotId');
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
  const queryClient = useQueryClient();
  const balance = useAuthStore((state) => state.user?.credit ?? 0);
  const setPaymentReturnUrl = usePaymentStore((state) => state.setReturnUrl);

  const [activeStimulusIdx, setActiveStimulusIdx] = useState(0);
  const [taskContents, setTaskContents] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [showScoringDialog, setShowScoringDialog] = useState(false);
  // aiQuota phản ánh đúng: nếu user chưa dùng AI hôm nay → effectiveCost=0 (miễn phí), ngược lại = giá VND thật
  const [aiQuota, setAiQuota] = useState<ServiceQuotaResponse | null>(null);
  const [expertCost, setExpertCost] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [showExpertDialog, setShowExpertDialog] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Khi thiếu số dư: đóng dialog, set returnUrl='/scoring-history' để sau khi nạp xong
  // checkout auto-redirect về history → user chấm lại bài vừa submit
  const handleTopUp = useCallback(() => {
    setShowScoringDialog(false);
    setPaymentReturnUrl('/scoring-history');
    router.push('/payment');
  }, [router, setPaymentReturnUrl]);

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
    if (!submitted && isExamMode && examSession.session?.status === 'EXPIRED') {
      router.push(`/practice/writing/${id}/review`);
    }
  }, [isExamMode, examSession.session?.status, id, router, submitted]);

  // On mount: reset store + fetch service costs
  useEffect(() => {
    reset();
    // Lấy expert cost (cố định) từ /services; aiCost lấy từ /services/quota/ để biết còn free hôm nay không
    getServices()
      .then((services) => {
        setExpertCost(services.find((s) => s.serviceCode === 'EXPERT_WRITING_SCORE')?.creditCost ?? null);
      })
      .catch(() => {});
    getServiceQuota('AI_WRITING_SCORE').then(setAiQuota).catch(() => {});
    // Fetch active subscription to display quota source in scoring dialog
    getMyActiveSubscription().then(setActiveSubscription).catch(() => {});
  }, [reset]);

  // 1. Initialize taskContents + Load Draft
  useEffect(() => {
    if (!testDetail || isInitialized) return;

    let initialContents = testDetail.stimuli.map(() => '');
    const raw = localStorage.getItem(draftKey(id));
    
    if (raw) {
      try {
        const draft: WritingDraft = JSON.parse(raw);
        if (Array.isArray(draft.contents) && draft.contents.length === testDetail.stimuli.length) {
          initialContents = draft.contents;
        } else if ((draft as any).content) {
          // Fallback for old single-task drafts
          initialContents[0] = (draft as any).content;
        }
      } catch {
        localStorage.removeItem(draftKey(id));
      }
    }
    
    setTaskContents(initialContents);
    if (initialContents[activeStimulusIdx] !== undefined) {
      setContent(initialContents[activeStimulusIdx]);
    }
    setIsInitialized(true);
  }, [testDetail, id, isInitialized, activeStimulusIdx, setContent]);

  // 2. Memoized full contents for saving
  const allContents = useMemo(() => {
    const arr = [...taskContents];
    if (isInitialized && activeStimulusIdx < arr.length) {
      arr[activeStimulusIdx] = content;
    }
    return arr;
  }, [taskContents, activeStimulusIdx, content, isInitialized]);

  // 3. Handle switching tasks
  const handleTaskChange = (idx: number) => {
    if (idx === activeStimulusIdx) return;
    
    // Save current content to taskContents before switching
    setTaskContents(prev => {
      const next = [...prev];
      next[activeStimulusIdx] = content;
      return next;
    });
    
    // Switch task
    setActiveStimulusIdx(idx);
    
    // Load new content from taskContents into store
    const nextContent = taskContents[idx] || '';
    setContent(nextContent);
  };

  // 4. Auto-save allContents to localStorage
  useEffect(() => {
    if (!isInitialized || submitted) return;
    
    // Don't save if everything is empty to avoid overwriting with nothing
    if (allContents.every(c => !c)) return;

    localStorage.setItem(draftKey(id), JSON.stringify({ contents: allContents, elapsed }));
  }, [allContents, elapsed, id, submitted, isInitialized]);

  const handleContentChange = (val: string) => {
    setContent(val);
  };

  // Submit handler
  const handleSubmit = useCallback(() => {
    const stimulus = testDetail?.stimuli[activeStimulusIdx];
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
      .then(async (result) => {
        setSubmissionId(result.submissionId);
        localStorage.removeItem(draftKey(id));
        markCompleted(id);
        setSubmitted(true);
        setShowScoringDialog(true);
        // Mark slot as DONE immediately (backend will update score after grading)
        if (slotId) {
          completeSlot(Number(slotId), 0, 0).catch(() => {});
        }
      })
      .catch(() => {
        toast.error('Nộp bài thất bại', { description: 'Vui lòng thử lại.' });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [testDetail, activeStimulusIdx, isSubmitting, submitted, content, wordCount, id, markCompleted, slotId]);

  // Sync ref
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Mở confirm dialog trước khi submit — tránh user lỡ tay nộp bài thiếu nội dung.
  const requestSubmit = useCallback(() => {
    if (isSubmitting || submitted) return;
    setConfirmSubmitOpen(true);
  }, [isSubmitting, submitted]);

  // Grade handler
  const handleGrade = useCallback(() => {
    const stimulus = testDetail?.stimuli[activeStimulusIdx];
    if (!testDetail || !stimulus) return;
    const taskType: WritingTaskType = testDetail.section === 1 ? 1 : 2;
    const prompt = stimulus.content || testDetail.description || FALLBACK_PROMPT;
    const answer = stripHtml(content);
    submitForGrading({
      taskType, question: prompt, answer,
      stimulusId: stimulus.id, submissionId: submissionId ?? undefined,
    }).then(() => {
      refreshProfile();
      // Invalidate subscription query → banner trong user menu refresh quota ngay.
      queryClient.invalidateQueries({ queryKey: ['my-active-subscription'] });
      // Update slot with actual band after grading
      if (slotId) {
        const band = useWritingStore.getState().gradingResult?.overallBand ?? 0;
        if (band > 0) {
          completeSlot(Number(slotId), Math.round(band * 10), 90).catch(() => {});
        }
      }
      if (submissionId) router.push(`/writing/result/${submissionId}`);
    });
  }, [testDetail, activeStimulusIdx, content, submissionId, submitForGrading, refreshProfile, router, slotId, queryClient]);

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

  // Derived values for active task
  const currentStimulus = testDetail.stimuli[activeStimulusIdx] || testDetail.stimuli[0];
  const taskType: WritingTaskType = testDetail.section === 1 ? 1 : 2;
  const prompt = currentStimulus?.content || testDetail.description || FALLBACK_PROMPT;
  const chartImageUrl = taskType === 1 ? (currentStimulus?.mediaUrl ?? undefined) : undefined;
  // Bài mẫu admin lưu vào explanation.text (edit flow); fallback instruction (legacy create flow)
  const firstGroup = currentStimulus?.questionGroups[0];
  const firstQuestion = firstGroup?.questions[0];
  const sampleFromExplanation = (firstQuestion?.explanation as { text?: string } | undefined)?.text;
  const sampleAnswer = sampleFromExplanation || firstGroup?.instruction || undefined;

  const totalTasks = testDetail.stimuli.length;
  const taskTypes = testDetail.stimuli.map(() => (testDetail.section === 1 ? 1 : 2) as WritingTaskType);

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
          onContentChange={handleContentChange}
          onSubmit={requestSubmit}
          isSubmitting={isSubmitting}
          submitted={submitted}
          countdownDisplay={countdownTimer.formatted}
          remainingSeconds={countdownTimer.remaining}
          testTitle={testDetail.title}
          totalTasks={totalTasks}
          activeTaskIndex={activeStimulusIdx}
          onTaskChange={handleTaskChange}
          taskTypes={taskTypes}
        />
        <WritingScoringOptionsDialog
          open={showScoringDialog}
          aiQuota={aiQuota}
          expertCost={expertCost}
          balance={balance}
          activeSubscription={activeSubscription}
          onAIScore={() => { setShowScoringDialog(false); handleGrade(); }}
          onExpertScore={() => { setShowScoringDialog(false); setShowExpertDialog(true); }}
          onSkip={() => { setShowScoringDialog(false); router.push('/scoring-history'); }}
          onTopUp={handleTopUp}
        />
        <WritingExpertSelectionDialog
          open={showExpertDialog}
          onOpenChange={setShowExpertDialog}
          submissionId={submissionId}
          expertCost={expertCost}
        />
        <WritingScoringProgressDialog open={isGrading} />
        <ConfirmDialog
          open={confirmSubmitOpen}
          onOpenChange={setConfirmSubmitOpen}
          title="Nộp bài Writing?"
          description={(() => {
            const min = taskType === 1 ? 150 : 250;
            const short = wordCount < min;
            const base = `Bạn đã viết ${wordCount} từ (tối thiểu ${min}). Sau khi nộp, bạn sẽ chọn cách chấm điểm (AI hoặc Giảng viên).`;
            return short ? `⚠️ Bài chưa đạt số từ tối thiểu. ${base}` : base;
          })()}
          confirmText="Nộp bài"
          cancelText="Viết tiếp"
          variant={wordCount < (taskType === 1 ? 150 : 250) ? 'destructive' : 'default'}
          onConfirm={() => handleSubmit()}
        />
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
        onContentChange={handleContentChange}
        onSubmit={requestSubmit}
        isSubmitting={isSubmitting}
        submitted={submitted}
        elapsedTime={elapsedTime}
        onExit={() => setExitOpen(true)}
        totalTasks={totalTasks}
        activeTaskIndex={activeStimulusIdx}
        onTaskChange={handleTaskChange}
        taskTypes={taskTypes}
      />

      <WritingScoringOptionsDialog
        open={showScoringDialog}
        aiQuota={aiQuota}
        expertCost={expertCost}
        balance={balance}
        activeSubscription={activeSubscription}
        onAIScore={() => { setShowScoringDialog(false); handleGrade(); }}
        onExpertScore={() => { setShowScoringDialog(false); setShowExpertDialog(true); }}
        onSkip={() => { setShowScoringDialog(false); router.push('/scoring-history'); }}
        onTopUp={handleTopUp}
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

      <ConfirmDialog
        open={confirmSubmitOpen}
        onOpenChange={setConfirmSubmitOpen}
        title="Nộp bài Writing?"
        description={(() => {
          const min = taskType === 1 ? 150 : 250;
          const short = wordCount < min;
          const base = `Bạn đã viết ${wordCount} từ (tối thiểu ${min}). Sau khi nộp, bạn sẽ chọn cách chấm điểm (AI hoặc Giảng viên).`;
          return short ? `⚠️ Bài chưa đạt số từ tối thiểu. ${base}` : base;
        })()}
        confirmText="Nộp bài"
        cancelText="Viết tiếp"
        variant={wordCount < (taskType === 1 ? 150 : 250) ? 'destructive' : 'default'}
        onConfirm={() => handleSubmit()}
      />
    </>
  );
}
