'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Sparkles, ChevronDown, ChevronUp, PenLine, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WritingScoringProgressDialog } from '@/components/writing/writing-scoring-progress-dialog';
import { WritingPromptPanel } from '@/components/writing/writing-prompt-panel';
import { useTestDetail } from '@/hooks/use-test-detail';
import { useAuthStore } from '@/store/auth-store';
import { useWritingStore } from '@/store/writing-store';
import { getWritingSubmissionDetail, type WritingSubmissionDetail } from '@/lib/ai-api';
import { getMyActiveSubscription } from '@/lib/subscription-api';
import type { UserSubscriptionResponse } from '@/types/subscription.types';
import { getServiceQuota, type ServiceQuotaResponse } from '@/lib/payment-api';
import type { WritingTaskType } from '@/types/writing.types';
import { normalise } from '@/components/score-result/normalise';
import { ResultHero } from '@/components/score-result/hero';
import { ResultInsights } from '@/components/score-result/insights';
import { ResultCriteriaDetail } from '@/components/score-result/criteria-detail';
import { ResultHighlightedEssay } from '@/components/score-result/highlighted-essay';

interface Props {
  params: Promise<{ id: string }>;
}

export default function WritingResultPage({ params }: Props) {
  const { id } = use(params);
  const submissionId = Number(id);
  const router = useRouter();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { rawScoringData, isGrading, submitForGrading } = useWritingStore();

  const [submission, setSubmission] = useState<WritingSubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [essayOpen, setEssayOpen] = useState(true);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [aiQuota, setAiQuota] = useState<ServiceQuotaResponse | null>(null);

  const testIdStr = submission?.testId ? String(submission.testId) : '';
  const { testDetail } = useTestDetail(testIdStr);

  const fetchSubmission = useCallback(async () => {
    try {
      const data = await getWritingSubmissionDetail(submissionId);
      setSubmission(data);
    } catch {
      toast.error('Không tìm thấy bài viết');
      router.replace('/scoring-history');
    } finally {
      setLoading(false);
    }
  }, [submissionId, router]);

  useEffect(() => {
    fetchSubmission();
    getMyActiveSubscription().then(setActiveSubscription).catch(() => {});
    getServiceQuota('AI_WRITING_SCORE').then(setAiQuota).catch(() => {});
  }, [fetchSubmission]);

  const handleAiScore = async () => {
    if (!submission) return;
    const stimulus = testDetail?.stimuli[0];
    const rawPrompt = stimulus?.content ?? '';
    const taskType = submission.taskType === 'TASK_1' ? 1 : 2;

    await submitForGrading({
      taskType,
      question: rawPrompt,
      answer: submission.essayContent,
      stimulusId: submission.stimulusId ?? undefined,
      submissionId: submission.submissionId,
    });
    refreshProfile();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }
  if (!submission) return null;

  const stimulus = testDetail?.stimuli[0];
  const taskType: WritingTaskType = submission.taskType === 'TASK_1' ? 1 : 2;
  const prompt = stimulus?.content ?? '';
  const chartImageUrl = stimulus?.mediaUrl ?? undefined;
  const hasEvaluation = submission.evaluation != null;

  // Ưu tiên rawScoringData (chấm mới xong) > evaluation đã lưu
  const rawForDisplay: Record<string, unknown> | null =
    rawScoringData ?? (hasEvaluation ? (submission.evaluation as Record<string, unknown>) : null);

  const normData = rawForDisplay ? normalise(rawForDisplay, taskType) : null;
  const scored = normData !== null;

  const AI_UNLIMITED_CAP = 500;
  const hasFreeToday = !aiQuota || !aiQuota.usedToday;
  const hasSubQuota = activeSubscription
    ? activeSubscription.remainAi === -1
      ? activeSubscription.usedAi < AI_UNLIMITED_CAP
      : activeSubscription.remainAi > 0
    : false;
  const hasAiQuota = hasFreeToday || hasSubQuota;

  const submittedDate = new Date(
    submission.submittedAt.includes('Z') ? submission.submittedAt : submission.submittedAt + 'Z',
  ).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Format elapsed time for display
  const timeTakenText = submission.timeTakenSeconds != null
    ? `${Math.floor(submission.timeTakenSeconds / 60)} phút ${submission.timeTakenSeconds % 60} giây`
    : null;

  return (
    <div className="h-[calc(100vh-56px)] overflow-y-auto bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/scoring-history">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h3 className="font-bold">Chi tiết bài viết</h3>
          <p className="text-xs text-muted-foreground">{submittedDate}</p>
        </div>
        <Badge
          variant={scored ? 'default' : 'secondary'}
          className={scored ? 'bg-emerald-100 text-emerald-700 border-0' : ''}
        >
          {scored ? 'Đã chấm điểm' : 'Chưa chấm điểm'}
        </Badge>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 pb-16">
        {/* Hero + 4 criterion bars */}
        {normData && (
          <ResultHero
            overall={normData.overall}
            criteria={normData.criteria}
            skillChipLabel={`Writing · Task ${taskType}`}
            title="Kết quả bài viết của bạn"
            metaItems={[
              { icon: <Calendar className="h-3.5 w-3.5" />, text: submittedDate },
              { icon: <FileText className="h-3.5 w-3.5" />, text: `${submission.wordCount} từ` },
              ...(timeTakenText ? [{ icon: <Clock className="h-3.5 w-3.5" />, text: timeTakenText }] : []),
            ]}
          />
        )}

        {/* Prompt */}
        {prompt && (
          <div className="rounded-3xl border border-teal-100/60 bg-gradient-to-br from-teal-50/40 to-emerald-50/20 p-5 shadow-sm">
            <WritingPromptPanel prompt={prompt} chartImageUrl={chartImageUrl || ''} taskType={taskType} />
          </div>
        )}

        {/* 3-column insights (hide when feedback skipped) */}
        {normData && !normData.feedbackSkipped && <ResultInsights data={normData} />}

        {/* Accordion phân tích chi tiết */}
        {normData && <ResultCriteriaDetail criteria={normData.criteria} />}

        {/* Off-topic / spam warning */}
        {normData?.feedbackSkipped && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-amber-800 font-semibold text-sm">
              {normData.feedbackSkipReason || 'Bài viết bị đánh giá lạc đề hoặc không hợp lệ nên không có phản hồi cải thiện.'}
            </p>
            <p className="text-amber-600 text-xs mt-2">
              {normData.overall_strategy}
            </p>
          </div>
        )}

        {/* Essay với highlights hoặc plain */}
        {normData && !normData.feedbackSkipped && normData.improvements.length > 0 ? (
          <div className="space-y-5 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="h-6 w-6 text-teal-600" />
                  Chữa bài chi tiết
                </h2>
                <p className="text-[13px] text-slate-500 mt-1 font-semibold">
                  Bấm vào các phần được đánh dấu để xem gợi ý sửa đổi
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-white/80 border-slate-200 px-3 py-1 font-mono text-[11px] font-bold shadow-sm whitespace-nowrap text-slate-600"
              >
                {submission.wordCount} WORDS
              </Badge>
            </div>
            <ResultHighlightedEssay essay={submission.essayContent} improvements={normData.improvements} />
          </div>
        ) : (
          <CollapsibleEssay
            essay={submission.essayContent}
            wordCount={submission.wordCount}
            isOpen={essayOpen}
            onToggle={() => setEssayOpen((o) => !o)}
          />
        )}

        {/* CTA chấm điểm AI khi chưa có kết quả */}
        {!scored && (
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-teal-200 rounded-3xl bg-gradient-to-br from-teal-50/60 to-emerald-50/30 mt-6 shadow-sm">
            <div className="bg-white p-4 rounded-full shadow-sm border border-teal-100 mb-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-teal-100/60 opacity-50 blur-xl" />
              <Sparkles className="h-8 w-8 text-teal-600 relative z-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-3 text-center tracking-tight">
              Chấm điểm bài viết với AI
            </h3>
            <p className="text-[14px] text-slate-600 text-center max-w-md mb-8 leading-relaxed font-medium">
              AI sẽ cung cấp band điểm dự kiến, phân tích chi tiết theo 4 tiêu chí IELTS và chữa lỗi trực tiếp trên bài.
            </p>
            {hasAiQuota ? (
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={handleAiScore}
                  disabled={isGrading}
                  size="lg"
                  className="gap-2.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-500/20 px-8 py-6 rounded-full font-bold text-[15px] transition-all hover:-translate-y-0.5"
                >
                  <Sparkles className="h-5 w-5 text-amber-300" />
                  Bắt đầu chấm điểm
                </Button>
                <span className="text-xs text-slate-500 font-medium">
                  {hasFreeToday
                    ? 'Miễn phí 1 lượt/ngày'
                    : activeSubscription
                      ? `Còn ${activeSubscription.remainAi === -1 ? AI_UNLIMITED_CAP - activeSubscription.usedAi : activeSubscription.remainAi} lượt chấm AI (gói ${activeSubscription.planName})`
                      : ''}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-amber-600 font-semibold">Bạn chưa có lượt chấm AI</p>
                <Button
                  onClick={() => router.push('/payment')}
                  size="lg"
                  className="gap-2.5 bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20 px-8 py-6 rounded-full font-bold text-[15px] transition-all hover:-translate-y-0.5"
                >
                  Mua gói chấm điểm
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <WritingScoringProgressDialog open={isGrading} />
    </div>
  );
}

// Essay collapse khi chưa có highlights (trường hợp chấm bởi expert, không có sentence-level improvements)
function CollapsibleEssay({
  essay,
  wordCount,
  isOpen,
  onToggle,
}: {
  essay: string;
  wordCount: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors group"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="bg-teal-50 group-hover:bg-teal-100 p-2.5 rounded-xl border border-teal-100/50 transition-colors">
            <PenLine className="h-5 w-5 text-teal-600" />
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="text-[15px] font-extrabold text-slate-900">Bài viết của bạn</span>
            <Badge
              variant="secondary"
              className="text-[10px] bg-slate-100 text-slate-600 font-bold border-slate-200 shadow-sm"
            >
              {wordCount} words
            </Badge>
          </div>
        </div>
        <div className="bg-slate-50 group-hover:bg-slate-100 border border-slate-200 p-2 rounded-full transition-colors">
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 pt-2">
          <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-6 md:p-8">
            <p className="text-[14px] md:text-[15px] text-slate-800 leading-[1.9] whitespace-pre-wrap font-serif">
              {essay}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
