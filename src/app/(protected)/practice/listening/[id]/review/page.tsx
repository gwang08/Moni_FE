'use client';

import { use, useEffect, useRef, useState } from 'react';
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
  textAnswers?: Record<number, string>;
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
  const loadedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
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

      {/* Audio player + Transcript + Review panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Audio player */}
        {stimulus.mediaUrl && (
          <div className="px-6 py-3 bg-violet-50 border-b">
            <audio ref={audioRef} controls src={stimulus.mediaUrl} className="w-full h-10" />
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Review panel (answers) */}
          <div className="w-1/2 border-r overflow-hidden">
            <ReadingReviewPanel
              stimulus={stimulus}
              answers={resultData.answers}
              textAnswers={resultData.textAnswers}
              onLocateEvidence={() => {}}
            />
          </div>

          {/* Transcript panel - always visible for listening */}
          <div className="w-1/2 overflow-y-auto p-4 space-y-1">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 sticky top-0 bg-white py-1 z-10">Transcript</h4>
            {stimulus.transcript && stimulus.transcript.length > 0 ? (
              stimulus.transcript.map((seg, i) => {
                const mins = Math.floor(seg.startTime / 60);
                const secs = Math.floor(seg.startTime % 60);
                const ts = `${mins}:${secs.toString().padStart(2, '0')}`;
                return (
                  <button
                    key={seg.id || i}
                    type="button"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = seg.startTime;
                        audioRef.current.play();
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-violet-50 transition-colors group text-sm"
                  >
                    <span className="text-[10px] text-violet-500 font-mono group-hover:text-violet-700 mr-2">{ts}</span>
                    {seg.speaker && <span className="text-xs font-semibold text-gray-500 mr-1">{seg.speaker}:</span>}
                    <span className="text-gray-700">{seg.text}</span>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Chưa có transcript cho bài nghe này.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
