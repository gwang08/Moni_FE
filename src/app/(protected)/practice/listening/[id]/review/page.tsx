'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ReadingReviewPanel } from '@/components/reading/reading-review-panel';
import { useTestDetail } from '@/hooks/use-test-detail';

interface ResultData {
  attemptId?: number;
  testId: string;
  answers: Record<number, number>;
  elapsedSeconds: number;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ListeningReviewPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { testDetail, loading, error } = useTestDetail(id);
  const [resultData, setResultData] = useState<ResultData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`practice-result-${id}`);
    if (!raw) { router.replace(`/practice/listening/${id}`); return; }
    try { setResultData(JSON.parse(raw)); } catch { router.replace(`/practice/listening/${id}`); }
  }, [id, router]);

  if (loading || !resultData) {
    return <SkeletonPractice />;
  }

  if (error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice?skill=listening"><Button variant="outline">Quay lại danh sách</Button></Link>
      </div>
    );
  }

  const stimulus = testDetail.stimuli[0];
  if (!stimulus) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-gray-500">Không có nội dung để xem lại.</p>
        <Link href={`/practice/listening/${id}/result`}><Button variant="outline">Quay lại</Button></Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href={`/practice/listening/${id}/result`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="font-bold">{testDetail.title}</h1>
          <p className="text-xs text-muted-foreground">Xem giải thích chi tiết</p>
        </div>
      </div>

      {/* Audio player + Review panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Audio player if available */}
        {stimulus.mediaUrl && (
          <div className="px-6 py-3 bg-violet-50 border-b">
            <audio controls src={stimulus.mediaUrl} className="w-full h-10" />
          </div>
        )}

        {/* Review panel (reuse Reading's) */}
        <div className="flex-1 overflow-hidden">
          <ReadingReviewPanel
            stimulus={stimulus}
            answers={resultData.answers}
            onLocateEvidence={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
