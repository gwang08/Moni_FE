'use client';

import { use, useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ReadingReviewPanel } from '@/components/reading/reading-review-panel';
import { useTestDetail } from '@/hooks/use-test-detail';
import { getAttemptResult } from '@/lib/practice-api';
import { formatReadingPassage } from '@/lib/format-reading-passage';

interface ResultData {
  attemptId?: number;
  testId: string;
  answers: Record<number, number>;
  textAnswers?: Record<number, string>;
  elapsedSeconds: number;
  /** Explanation/evidence from API keyed by questionId */
  explanations?: Record<number, { text?: string; evidence?: string }>;
}

/** Injects <mark> highlights around all evidence chunks in passage HTML */
function injectEvidence(html: string, evidence: string | null): string {
  if (!evidence) return html;
  const chunks = evidence.split('\n---\n').filter(e => e.trim());
  let result = html;
  chunks.forEach((chunk) => {
    const escaped = chunk.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(
      new RegExp(`(${escaped})`, 'gi'),
      `<mark class="bg-amber-200 rounded px-0.5">$1</mark>`
    );
  });
  return result;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ReadingReviewPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');
  const { testDetail, loading, error } = useTestDetail(id);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Try sessionStorage first (just-submitted flow)
    const raw = sessionStorage.getItem(`practice-result-${id}`);
    if (raw) {
      try { setResultData(JSON.parse(raw)); return; } catch { /* fall through */ }
    }

    // If attemptId in URL, fetch from API (history review flow)
    if (attemptIdParam) {
      getAttemptResult(Number(attemptIdParam)).then((res) => {
        const answers: Record<number, number> = {};
        const textAnswers: Record<number, string> = {};
        const explanations: Record<number, { text?: string; evidence?: string }> = {};
        for (const r of res.results) {
          if (r.selectedOptionId != null) answers[r.questionId] = r.selectedOptionId;
          if (r.answerText) textAnswers[r.questionId] = r.answerText;
          if (r.explanation || r.evidence) {
            explanations[r.questionId] = {
              text: r.explanation ?? undefined,
              evidence: r.evidence ?? undefined,
            };
          }
        }
        setResultData({
          attemptId: res.attemptId,
          testId: id,
          answers,
          textAnswers,
          elapsedSeconds: res.elapsedSeconds,
          explanations,
        });
      }).catch(() => {
        router.replace(`/practice/reading/${id}`);
      });
      return;
    }

    // No data available, redirect
    router.replace(`/practice/reading/${id}`);
  }, [id, router, attemptIdParam]);

  // Scroll to highlighted mark after evidence is set
  useEffect(() => {
    if (!activeEvidence) return;
    setTimeout(() => {
      const mark = document.querySelector('mark.bg-amber-200');
      mark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }, [activeEvidence]);

  const stimuli = testDetail?.stimuli[0];

  // Merge API explanation/evidence into stimulus questions (for history review)
  const explanationsJson = resultData?.explanations ? JSON.stringify(resultData.explanations) : '';
  const enrichedStimulus = useMemo(() => {
    if (!stimuli || !explanationsJson) return stimuli;
    const explanations: Record<number, { text?: string; evidence?: string }> = JSON.parse(explanationsJson);
    return {
      ...stimuli,
      questionGroups: stimuli.questionGroups.map((g) => ({
        ...g,
        questions: g.questions.map((q) => {
          const apiExpl = explanations[q.id];
          if (!apiExpl) return q;
          return {
            ...q,
            explanation: {
              ...q.explanation,
              text: apiExpl.text ?? q.explanation?.text,
              evidence: apiExpl.evidence ?? q.explanation?.evidence,
            },
          };
        }),
      })),
    };
  }, [stimuli, explanationsJson]);

  const passageHtml = useMemo(() => {
    const formatted = formatReadingPassage(stimuli?.content ?? '');
    return injectEvidence(formatted, activeEvidence);
  }, [stimuli?.content, activeEvidence]);

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
            stimulus={enrichedStimulus!}
            answers={resultData.answers}
            textAnswers={resultData.textAnswers}
            onLocateEvidence={setActiveEvidence}
          />
        </div>
      </div>
    </div>
  );
}
