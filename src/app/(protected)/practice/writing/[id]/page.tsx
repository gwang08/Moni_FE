'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { WritingPracticeHeader } from '@/components/writing/writing-practice-header';
import { WritingPromptPanel } from '@/components/writing/writing-prompt-panel';
import { WritingEditor } from '@/components/writing/writing-editor';
import { WritingToolbarPanel } from '@/components/writing/writing-toolbar-panel';
import { GradingModal } from '@/components/writing/grading-modal';
import { WritingScoringOptionsDialog } from '@/components/writing/writing-scoring-options-dialog';
import { getServices } from '@/lib/payment-api';
import { useWritingStore } from '@/store/writing-store';
import { usePracticeStore } from '@/store/practice-store';
import { useTestDetail } from '@/hooks/use-test-detail';
import { useElapsedTimer } from '@/hooks/use-elapsed-timer';
import { submitAttempt } from '@/lib/practice-api';
import { submitWriting } from '@/lib/ai-api';
import { useRouter } from 'next/navigation';
import type { WritingTaskType } from '@/types/writing.types';

const FALLBACK_PROMPT = 'Hãy viết một bài luận bày tỏ quan điểm của bạn về chủ đề được đề cập.';

interface Props {
  params: Promise<{ id: string }>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Key localStorage cho draft theo testId */
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
  const { testDetail, loading, error } = useTestDetail(id);

  const {
    content,
    wordCount,
    gradingResult,
    isGrading,
    submitForGrading,
    reset,
    setContent,
  } = useWritingStore();
  const markCompleted = usePracticeStore((state) => state.markCompleted);

  const [showGrading, setShowGrading] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [showScoringDialog, setShowScoringDialog] = useState(false);
  const [aiCost, setAiCost] = useState<number | null>(null);
  const [expertCost, setExpertCost] = useState<number | null>(null);

  // Draft restore dialog
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<WritingDraft | null>(null);
  // Restored content passed to editor
  const [restoredContent, setRestoredContent] = useState<string | undefined>(undefined);
  // Editor remount key — force re-init when content is restored
  const [editorKey, setEditorKey] = useState(0);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  const { elapsed, formatted: elapsedTime } = useElapsedTimer(isGrading);

  // Auto-save debounce timer
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Check draft after testDetail loads
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testDetail]);

  // Auto-save draft on content/wordCount/elapsed change (debounce 1s)
  useEffect(() => {
    if (submitted) return; // Don't auto-save after submission
    if (!content && wordCount === 0) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const draft: WritingDraft = { content, wordCount, elapsed };
      localStorage.setItem(draftKey(id), JSON.stringify(draft));
    }, 1000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [content, wordCount, elapsed, id, submitted]);

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

  const canGrade = wordCount > 0 && !isGrading && !submitted;

  // Phase 2: Nộp bài (lưu essay, không chấm điểm ngay)
  const handleSubmit = async () => {
    if (!stimulus || isSubmitting || submitted) return;
    setIsSubmitting(true);
    try {
      const answer = stripHtml(content);

      // 1. Lưu essay vào DB
      const result = await submitWriting({
        testId: Number(id),
        stimulusId: stimulus.id,
        taskType,
        essayContent: answer,
        wordCount,
      });
      setSubmissionId(result.submissionId);

      // 2. Ghi lịch sử luyện tập
      try {
        await submitAttempt({
          testId: Number(id),
          stimulusId: stimulus.id,
          elapsedSeconds: elapsed,
          answers: [{ questionId: stimulus.questionGroups[0]?.questions[0]?.id ?? 0, answerText: answer }],
        });
      } catch { /* không ảnh hưởng đến luồng nộp bài */ }

      // 3. Xoá draft
      localStorage.removeItem(draftKey(id));
      markCompleted(id);

      // 4. Đánh dấu đã nộp — giữ nguyên trang để Phase 3 hiển thị dialog chấm điểm
      setSubmitted(true);
      setShowScoringDialog(true);
    } catch {
      toast.error('Nộp bài thất bại', { description: 'Vui lòng thử lại.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 3 (giữ lại): Chấm điểm AI
  const handleGrade = async () => {
    const answer = stripHtml(content);
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
    if (!submitted) {
      markCompleted(id);
      if (stimulus) {
        try {
          await submitAttempt({
            testId: Number(id),
            stimulusId: stimulus.id,
            elapsedSeconds: elapsed,
            answers: [{ questionId: stimulus.questionGroups[0]?.questions[0]?.id ?? 0, answerText: answer }],
          });
        } catch { /* ignore */ }
      }
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
        submitted={submitted}
        isSubmitting={isSubmitting}
        onGrade={handleSubmit}
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
            key={editorKey}
            taskType={taskType}
            sampleAnswer={sampleAnswer}
            showSample={showSample}
            onToggleSample={() => setShowSample(v => !v)}
            readOnly={submitted}
            initialContent={restoredContent}
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

      {/* Phase 3: Scoring options dialog (mở sau khi nộp bài) */}
      <WritingScoringOptionsDialog
        open={showScoringDialog}
        aiCost={aiCost}
        expertCost={expertCost}
        onAIScore={() => {
          setShowScoringDialog(false);
          handleGrade();
        }}
        onExpertScore={() => {
          setShowScoringDialog(false);
          router.push(`/expert-scoring?skill=writing&testId=${id}`);
        }}
        onSkip={() => {
          setShowScoringDialog(false);
          router.push('/practice?skill=writing');
        }}
      />

      <GradingModal
        isOpen={showGrading}
        onClose={() => setShowGrading(false)}
        result={gradingResult}
        isLoading={isGrading}
      />

      {/* Draft restore dialog */}
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
