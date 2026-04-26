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
  explanations?: Record<number, { 
    text?: string; 
    evidence?: string;
    offsets?: number[];
    startOffsets?: number[];
    endOffsets?: number[];
  }>;
}

function toSearchableText(value: string): string {
  let result = '';
  let lastWasSpace = true;

  for (const ch of value) {
    if (/[\p{L}\p{N}]/u.test(ch)) {
      result += ch.toLowerCase();
      lastWasSpace = false;
    } else if (!lastWasSpace) {
      result += ' ';
      lastWasSpace = true;
    }
  }

  return result.trim();
}

function buildSearchIndex(root: ParentNode): { text: string; map: Array<{ node: Text; offset: number }> } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const map: Array<{ node: Text; offset: number }> = [];
  let text = '';
  let lastWasSpace = true;

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const textNode = node as Text;
    const value = textNode.nodeValue ?? '';
    for (let i = 0; i < value.length; i += 1) {
      const ch = value[i];
      if (/[\p{L}\p{N}]/u.test(ch)) {
        text += ch.toLowerCase();
        map.push({ node: textNode, offset: i });
        lastWasSpace = false;
      } else if (!lastWasSpace) {
        text += ' ';
        map.push({ node: textNode, offset: i });
        lastWasSpace = true;
      }
    }
  }

  return { text: text.trim(), map };
}

function findSearchCandidates(chunk: string): string[] {
  const searchable = toSearchableText(chunk);
  if (!searchable) return [];

  const words = searchable.split(' ').filter(Boolean);
  const candidates = [searchable];

  if (words.length > 6) {
    candidates.push(words.slice(0, 6).join(' '));
    candidates.push(words.slice(-6).join(' '));
  }

  return [...new Set(candidates.filter((candidate) => candidate.trim().length >= 3))];
}

/** Injects <mark> highlights around all evidence chunks in passage HTML */
function injectEvidence(html: string, evidence: string | null, startOffset?: number, endOffset?: number): string {
  if (!evidence) return html;
  if (typeof DOMParser === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Priority 1: Use exact offsets if provided
  if (startOffset !== undefined && endOffset !== undefined && startOffset !== -1 && endOffset !== -1) {
    const { map } = buildSearchIndex(doc.body);
    const startEntry = map[startOffset];
    const endEntry = map[endOffset];

    if (startEntry && endEntry) {
      const range = doc.createRange();
      range.setStart(startEntry.node, startEntry.offset);
      range.setEnd(endEntry.node, endEntry.offset + 1);

      const mark = doc.createElement('mark');
      mark.className = 'bg-amber-200 rounded px-0.5';

      try {
        range.surroundContents(mark);
        return doc.body.innerHTML;
      } catch {
        const fragment = range.extractContents();
        mark.appendChild(fragment);
        range.insertNode(mark);
        return doc.body.innerHTML;
      }
    }
  }

  // Priority 2: Use heuristic matching (legacy or missing metadata)
  const chunks = evidence.split('\n---\n').filter((e) => e.trim());

  for (const chunk of chunks) {
    const candidates = findSearchCandidates(chunk);
    let matched = false;

    for (const candidate of candidates) {
      const { text, map } = buildSearchIndex(doc.body);
      const start = text.indexOf(candidate);
      if (start === -1) continue;

      const end = start + candidate.length - 1;
      const startEntry = map[start];
      const endEntry = map[end];
      if (!startEntry || !endEntry) continue;

      const range = doc.createRange();
      range.setStart(startEntry.node, startEntry.offset);
      range.setEnd(endEntry.node, endEntry.offset + 1);

      const mark = doc.createElement('mark');
      mark.className = 'bg-amber-200 rounded px-0.5';

      try {
        range.surroundContents(mark);
      } catch {
        const fragment = range.extractContents();
        mark.appendChild(fragment);
        range.insertNode(mark);
      }

      matched = true;
      break;
    }

    if (!matched) continue;
  }

  return doc.body.innerHTML;
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
  const [activeEvidence, setActiveEvidence] = useState<{ text: string | null; startOffset?: number; endOffset?: number }>({ text: null });
  const [activeStimulusIdx, setActiveStimulusIdx] = useState(0);
  const loadedRef = useRef(false);
  const attemptLabel = resultData?.attemptId != null ? `#${resultData.attemptId}` : null;

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadFromSession = () => {
      const raw = sessionStorage.getItem(`practice-result-${id}`);
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw) as ResultData;
        Promise.resolve().then(() => setResultData(parsed));
        return true;
      } catch {
        return false;
      }
    };

    const loadFromAttempt = async (attemptId: string) => {
      const res = await getAttemptResult(Number(attemptId));
      const answers: Record<number, number> = {};
      const textAnswers: Record<number, string> = {};
      const explanations: Record<number, any> = {};
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
    };

    if (attemptIdParam) {
      loadFromAttempt(attemptIdParam)
        .catch(() => {
          if (!loadFromSession()) router.replace(`/practice/reading/${id}`);
        });
      return;
    }

    if (loadFromSession()) return;
    router.replace(`/practice/reading/${id}`);
  }, [id, router, attemptIdParam]);

  // Scroll to highlighted mark after evidence is set
  useEffect(() => {
    if (!activeEvidence.text) return;
    setTimeout(() => {
      const mark = document.querySelector('mark.bg-amber-200');
      mark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }, [activeEvidence]);

  const stimuli = testDetail?.stimuli ?? [];
  const safeActiveStimulusIdx = activeStimulusIdx < stimuli.length ? activeStimulusIdx : 0;
  const rawStimulus = stimuli[safeActiveStimulusIdx] ?? null;

  // Merge API explanation/evidence into stimulus questions (for history review)
  const explanationsJson = resultData?.explanations ? JSON.stringify(resultData.explanations) : '';
  const enrichedStimulus = useMemo(() => {
    if (!rawStimulus || !explanationsJson) return rawStimulus;
    const explanations: Record<number, any> = JSON.parse(explanationsJson);
    return {
      ...rawStimulus,
      questionGroups: rawStimulus.questionGroups.map((g) => ({
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
              offsets: apiExpl.offsets ?? q.explanation?.offsets,
              startOffsets: apiExpl.startOffsets ?? q.explanation?.startOffsets,
              endOffsets: apiExpl.endOffsets ?? q.explanation?.endOffsets,
            },
          };
        }),
      })),
    };
  }, [rawStimulus, explanationsJson]);

  const passageHtml = useMemo(() => {
    const formatted = formatReadingPassage(enrichedStimulus?.content ?? '');
    return injectEvidence(formatted, activeEvidence.text, activeEvidence.startOffset, activeEvidence.endOffset);
  }, [enrichedStimulus?.content, activeEvidence]);

  if (loading || !resultData) {
    return <SkeletonPractice />;
  }

  if (error || !testDetail || !enrichedStimulus) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice?skill=reading"><Button variant="outline">Quay lại danh sách</Button></Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col practice-view">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/scoring-history?skill=reading">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold truncate" title={testDetail.title}>{testDetail.title}</h1>
          <p className="text-xs text-muted-foreground">Xem giải thích chi tiết</p>
          {attemptLabel && (
            <p className="text-[10px] text-gray-500 font-medium">
              Lần làm bài: <span className="text-slate-800">{attemptLabel}</span>
            </p>
          )}
        </div>
      </div>

      {stimuli.length > 1 && (
        <div className="bg-white border-b px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {stimuli.map((s, index) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveStimulusIdx(index);
                setActiveEvidence({ text: null });
              }}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors whitespace-nowrap ${
                index === safeActiveStimulusIdx
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Passage {s.section ?? index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Passage with evidence highlight */}
        <div className="w-1/2 overflow-y-auto custom-scrollbar-thick p-6 border-r border-gray-200">
          {stimuli.length > 1 && (
            <h2 className="text-lg font-bold mb-4 text-slate-800">
              Passage {enrichedStimulus.section ?? safeActiveStimulusIdx + 1}
            </h2>
          )}
          <div
            className="prose max-w-none bg-white rounded-lg leading-relaxed text-base"
            dangerouslySetInnerHTML={{ __html: passageHtml }}
          />
        </div>

        {/* Right: Review panel */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <ReadingReviewPanel
            stimulus={enrichedStimulus}
            answers={resultData.answers}
            textAnswers={resultData.textAnswers}
            onLocateEvidence={(text, offset, startOffset, endOffset) => setActiveEvidence({ text, startOffset, endOffset })}
          />
        </div>
      </div>
    </div>
  );
}
