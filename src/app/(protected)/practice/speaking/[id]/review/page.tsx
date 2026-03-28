'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mic, Clock, Calendar } from 'lucide-react';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useTestDetail } from '@/hooks/use-test-detail';
import { getAttemptResult } from '@/lib/practice-api';
import type { AnswerResult } from '@/lib/practice-api';

interface Props {
  params: Promise<{ id: string }>;
}

interface AttemptData {
  attemptId: number;
  elapsedSeconds: number;
  submittedAt?: string;
  answersByQuestionId: Record<number, string | null>;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return `${m} phút ${s > 0 ? `${s} giây` : ''}`.trim();
}

export default function SpeakingReviewPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');
  const { testDetail, loading, error } = useTestDetail(id);
  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    if (!attemptIdParam) {
      router.replace('/practice?skill=speaking');
      return;
    }

    getAttemptResult(Number(attemptIdParam))
      .then((res) => {
        const answersByQuestionId: Record<number, string | null> = {};
        for (const r of res.results as AnswerResult[]) {
          answersByQuestionId[r.questionId] = r.answerText;
        }
        setAttemptData({
          attemptId: res.attemptId,
          elapsedSeconds: res.elapsedSeconds,
          answersByQuestionId,
        });
      })
      .catch(() => {
        setFetchError('Không thể tải kết quả bài làm. Vui lòng thử lại.');
      });
  }, [id, router, attemptIdParam]);

  if (loading || (!attemptData && !fetchError)) {
    return <SkeletonPractice />;
  }

  if (fetchError || error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-red-500">{fetchError || error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice?skill=speaking">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  // Aggregate all questions across stimuli (same logic as speaking practice page)
  const questions: { id: number; content: string; position: number; partNumber: number }[] = [];
  for (const stimulus of testDetail.stimuli) {
    const section = stimulus.section ?? 1;
    for (const group of stimulus.questionGroups ?? []) {
      for (const q of group.questions ?? []) {
        if (q.position === 0) continue;
        questions.push({
          id: q.id,
          content: q.content || '',
          position: q.position,
          partNumber: section,
        });
      }
    }
  }
  questions.sort((a, b) => a.partNumber - b.partNumber || a.position - b.position);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-violet-50/30">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/practice?skill=speaking">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold truncate">{testDetail.title}</h1>
          <p className="text-xs text-muted-foreground">Xem lại bài nói</p>
        </div>
        <Mic className="h-5 w-5 text-violet-400 shrink-0" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Audio note banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          Audio không thể nghe lại vì chưa được lưu trên server.
        </div>

        {/* Questions list */}
        {questions.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-center text-gray-400 text-sm">
            Không có câu hỏi nào.
          </div>
        ) : (
          questions.map((q, idx) => {
            const transcript = attemptData?.answersByQuestionId[q.id] ?? null;
            return (
              <div key={q.id} className="bg-white rounded-xl border border-violet-100 shadow-sm overflow-hidden">
                <div className="bg-violet-50 px-4 py-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">
                    Câu {idx + 1}
                  </span>
                  <span className="text-xs text-violet-400">· Part {q.partNumber}</span>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <p className="text-sm font-medium text-gray-800">{q.content}</p>
                  <div className="border-t border-violet-50 pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Câu trả lời của bạn</p>
                    {transcript ? (
                      <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Không có bản ghi</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Footer info */}
        {attemptData && (
          <div className="bg-white rounded-xl border border-violet-100 shadow-sm px-4 py-3 flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-violet-400" />
              Thời gian làm bài: <strong>{formatDuration(attemptData.elapsedSeconds)}</strong>
            </span>
            {attemptData.submittedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-violet-400" />
                Ngày nộp: <strong>{new Date(attemptData.submittedAt).toLocaleDateString('vi-VN')}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
