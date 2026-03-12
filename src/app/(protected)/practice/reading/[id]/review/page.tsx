'use client';

import { use, useEffect, useState, useMemo } from 'react';
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

/** Injects <mark> highlight around evidence text in passage HTML */
function injectEvidence(html: string, evidence: string | null): string {
  if (!evidence) return html;
  const escaped = evidence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(
    new RegExp(`(${escaped})`, 'i'),
    `<mark class="bg-amber-200 rounded px-0.5">$1</mark>`
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ReadingReviewPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { testDetail, loading, error } = useTestDetail(id);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`practice-result-${id}`);
    if (!raw) { router.replace(`/practice/reading/${id}`); return; }
    try { setResultData(JSON.parse(raw)); } catch { router.replace(`/practice/reading/${id}`); }
  }, [id, router]);

  // Scroll to highlighted mark after evidence is set
  useEffect(() => {
    if (!activeEvidence) return;
    setTimeout(() => {
      const mark = document.querySelector('mark.bg-amber-200');
      mark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }, [activeEvidence]);

  const stimuli = testDetail?.stimuli[0];
  const passageHtml = useMemo(
    () => injectEvidence(stimuli?.content ?? '', activeEvidence),
    [stimuli?.content, activeEvidence]
  );

  if (loading || !resultData) {
    return <SkeletonPractice />;
  }

  if (error || !testDetail || !stimuli) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice?skill=reading"><Button variant="outline">Quay lại danh sách</Button></Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href={`/practice/reading/${id}/result`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="font-bold">{testDetail.title}</h1>
          <p className="text-xs text-muted-foreground">Xem giải thích chi tiết</p>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Passage with evidence highlight */}
        <div className="w-1/2 overflow-y-auto p-6 border-r border-gray-200">
          <h2 className="text-xl font-bold mb-4">{testDetail.title}</h2>
          <div
            className="prose max-w-none bg-white rounded-lg leading-relaxed text-base"
            dangerouslySetInnerHTML={{ __html: passageHtml }}
          />
        </div>

        {/* Right: Review panel */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <ReadingReviewPanel
            stimulus={stimuli}
            answers={resultData.answers}
            onLocateEvidence={setActiveEvidence}
          />
        </div>
      </div>
    </div>
  );
}
