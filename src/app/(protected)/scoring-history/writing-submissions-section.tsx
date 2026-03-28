'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PenLine, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getWritingSubmissions, scoreWriting, type WritingSubmission, type WritingEvaluationStatus } from '@/lib/ai-api';
import { CreditConfirmDialog } from '@/components/scoring/credit-confirm-dialog';
import { useAuthStore } from '@/store/auth-store';

// Credit cost for AI writing scoring
const AI_WRITING_CREDIT_COST = 5;

function formatDate(dateStr: string): string {
  const d = new Date(
    dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  );
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: WritingEvaluationStatus }) {
  if (status === 'SUBMITTED' || status === 'PENDING') {
    return <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">Chưa chấm</Badge>;
  }
  if (status === 'PROCESSING') {
    return <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">Đang chấm...</Badge>;
  }
  if (status === 'COMPLETED') {
    return <Badge className="bg-green-100 text-green-800 border-0 text-xs">Đã chấm</Badge>;
  }
  if (status === 'FAILED') {
    return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Lỗi</Badge>;
  }
  return <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">{status}</Badge>;
}

interface WritingSubmissionsSectionProps {
  submissions: WritingSubmission[];
  loading: boolean;
  onRefresh: () => void;
  onViewResult: (submissionId: number) => void;
}

export function WritingSubmissionsSection({
  submissions,
  loading,
  onRefresh,
  onViewResult,
}: WritingSubmissionsSectionProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSubmissionId, setPendingSubmissionId] = useState<number | null>(null);
  const [scoringId, setScoringId] = useState<number | null>(null);

  const creditBalance = user?.credit ?? 0;

  const handleAiScore = (submissionId: number) => {
    setPendingSubmissionId(submissionId);
    setConfirmOpen(true);
  };

  const handleConfirmAiScore = async () => {
    if (!pendingSubmissionId) return;
    setConfirmOpen(false);
    setScoringId(pendingSubmissionId);
    try {
      // Call scoreWriting — we need essay content and question from the submission
      // Since we only have summary data here, navigate to the submission detail
      // In the interim, just call with empty params to trigger the endpoint
      toast.info('Đang gửi bài viết để chấm AI...');
      // The actual scoring needs essay content — navigate to writing result page
      router.push(`/writing/result/${pendingSubmissionId}`);
    } catch {
      toast.error('Không thể chấm điểm. Vui lòng thử lại.');
    } finally {
      setScoringId(null);
      setPendingSubmissionId(null);
    }
  };

  const handleSendExpert = (submissionId: number) => {
    router.push(`/experts?submissionId=${submissionId}&skill=WRITING`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <PenLine className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Bạn chưa có bài viết nào.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {submissions.map((sub) => (
          <div
            key={sub.submissionId}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            {/* Left: info */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="text-xs font-semibold">
                {sub.taskType === 'TASK_1' ? 'Task 1' : 'Task 2'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {sub.wordCount != null ? `${sub.wordCount} từ` : '—'}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(sub.submittedAt)}</span>
              <StatusBadge status={sub.evaluationStatus} />
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              {(sub.evaluationStatus === 'PENDING' || sub.evaluationStatus === 'SUBMITTED') && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={scoringId === sub.submissionId}
                    onClick={() => handleAiScore(sub.submissionId)}
                  >
                    {scoringId === sub.submissionId ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Chấm AI
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleSendExpert(sub.submissionId)}
                  >
                    Gửi Expert
                  </Button>
                </>
              )}
              {sub.evaluationStatus === 'PROCESSING' && (
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={onRefresh}>
                  <RefreshCw className="h-3 w-3" /> Làm mới
                </Button>
              )}
              {sub.evaluationStatus === 'COMPLETED' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onViewResult(sub.submissionId)}
                >
                  Xem kết quả
                </Button>
              )}
              {sub.evaluationStatus === 'FAILED' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 text-red-500 hover:text-red-600"
                  onClick={() => handleAiScore(sub.submissionId)}
                >
                  <RefreshCw className="h-3 w-3" /> Thử lại
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <CreditConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingSubmissionId(null); }}
        onConfirm={handleConfirmAiScore}
        serviceName="Chấm writing bằng AI"
        creditCost={AI_WRITING_CREDIT_COST}
        currentBalance={creditBalance}
      />
    </>
  );
}
