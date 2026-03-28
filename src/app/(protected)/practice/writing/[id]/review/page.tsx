'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, FileText } from 'lucide-react';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { WritingPromptPanel } from '@/components/writing/writing-prompt-panel';
import { useTestDetail } from '@/hooks/use-test-detail';
import { getAttemptResult } from '@/lib/practice-api';
import type { WritingTaskType } from '@/types/writing.types';

interface ReviewData {
  essayText: string;
  elapsedSeconds: number;
  submittedAt?: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function WritingReviewPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');
  const { testDetail, loading, error } = useTestDetail(id);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    if (!attemptIdParam) {
      router.replace(`/practice/writing/${id}`);
      return;
    }

    getAttemptResult(Number(attemptIdParam))
      .then((res) => {
        const essayResult = res.results[0];
        setReviewData({
          essayText: essayResult?.answerText ?? '',
          elapsedSeconds: res.elapsedSeconds,
        });
      })
      .catch(() => {
        router.replace(`/practice/writing/${id}`);
      });
  }, [id, router, attemptIdParam]);

  const stimulus = testDetail?.stimuli[0];
  const taskType: WritingTaskType = stimulus?.section === 1 ? 1 : 2;
  const prompt = stimulus?.content ?? '';
  const chartImageUrl = stimulus?.mediaUrl ?? undefined;
  const wordCount = reviewData ? countWords(reviewData.essayText) : 0;

  if (loading || !reviewData) {
    return <SkeletonPractice />;
  }

  if (error || !testDetail || !stimulus) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice?skill=writing">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/practice?skill=writing">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-bold">{testDetail.title}</h1>
          <p className="text-xs text-muted-foreground">Xem lại bài viết</p>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Writing prompt */}
        <div className="w-1/2 overflow-y-auto p-6 border-r border-gray-200 bg-gradient-to-b from-teal-50/40 to-emerald-50/20">
          <WritingPromptPanel
            prompt={prompt}
            chartImageUrl={chartImageUrl}
            taskType={taskType}
          />
        </div>

        {/* Right: Essay + meta info */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          {/* Meta info bar */}
          <div className="shrink-0 px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-teal-500" />
              <span className="font-medium text-gray-800">{wordCount}</span>
              <span>từ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-teal-500" />
              <span>{formatDuration(reviewData.elapsedSeconds)}</span>
            </div>
            {reviewData.submittedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-teal-500" />
                <span>{new Date(reviewData.submittedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>

          {/* Essay text */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-xs font-bold text-teal-500 uppercase tracking-wider mb-3">
              Bài viết của bạn
            </p>
            {reviewData.essayText ? (
              <div className="rounded-2xl bg-white border border-teal-100/60 p-5 shadow-sm">
                <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {reviewData.essayText}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 text-center text-gray-400 text-sm">
                Không có nội dung bài viết.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
