'use client';

import { useRouter } from 'next/navigation';
import { Loader2, PenLine, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WritingSubmission, WritingEvaluationStatus } from '@/lib/ai-api';

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
  aiCost: number;
  onRefresh: () => void;
  onViewResult: (submissionId: number) => void;
  onExpertScore: (submissionId: number) => void;
}

export function WritingSubmissionsSection({
  submissions,
  loading,
  onRefresh,
  onExpertScore,
}: WritingSubmissionsSectionProps) {
  const router = useRouter();

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
                  onClick={() => router.push(`/writing/result/${sub.submissionId}`)}
                >
                  Chấm AI
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onExpertScore(sub.submissionId)}
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
                onClick={() => router.push(`/writing/result/${sub.submissionId}`)}
              >
                Xem kết quả
              </Button>
            )}
            {sub.evaluationStatus === 'FAILED' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 text-red-500 hover:text-red-600"
                onClick={() => router.push(`/writing/result/${sub.submissionId}`)}
              >
                <RefreshCw className="h-3 w-3" /> Thử lại
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
