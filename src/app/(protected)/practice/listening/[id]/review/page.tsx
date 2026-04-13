'use client';

import { use, useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ListeningReviewPanel } from '@/components/listening/listening-review-panel';
import { ListeningPracticeAudioPlayer } from '@/components/listening/listening-practice-audio-player';
import { useTestDetail } from '@/hooks/use-test-detail';
import { getAttemptResult } from '@/lib/practice-api';
import type { TranscriptSegment } from '@/types/listening.types';
import type { StimulusDetail } from '@/types/test.types';

interface ResultData {
  attemptId?: number;
  testId: string;
  answers: Record<number, number>;
  textAnswers?: Record<number, string>;
  elapsedSeconds: number;
  explanations?: Record<number, { text?: string; evidence?: string }>;
}

interface Props {
  params: Promise<{ id: string }>;
}

type TranscriptLike = TranscriptSegment & { content?: string };

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function splitEvidenceChunks(evidence: string) {
  return evidence
    .split(/\n---\n|\r?\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function findTranscriptMatches(segments: TranscriptSegment[], evidenceChunks: string[]) {
  const matches: Array<{ chunkIndex: number; segmentIndex: number }> = [];

  evidenceChunks.forEach((chunk, chunkIndex) => {
    const normalizedChunk = normalizeText(chunk);
    if (normalizedChunk.length < 2) return;

    const phrase = normalizedChunk.length > 20
      ? normalizedChunk.split(/\s+/).slice(0, 5).join(' ')
      : normalizedChunk;

    const segmentIndex = segments.findIndex((segment) => {
      const segmentText = normalizeText(segment.text || segment.speaker || '');
      if (!segmentText) return false;
      if (segmentText.includes(normalizedChunk)) return true;
      return phrase.length > 10 && segmentText.includes(phrase);
    });

    if (segmentIndex >= 0) {
      matches.push({ chunkIndex, segmentIndex });
    }
  });

  return matches.sort((a, b) => a.chunkIndex - b.chunkIndex);
}

function isChunkMatched(text: string, chunk: string) {
  if (chunk.length < 2) return false;
  if (text.includes(chunk)) return true;
  if (chunk.length > 20) {
    const words = chunk.split(/\s+/).slice(0, 5).join(' ');
    return words.length > 10 && text.includes(words);
  }
  return false;
}

function getActiveContentSegmentIndex(container: HTMLDivElement, currentTime: number, audioDuration: number) {
  const segmentNodes = Array.from(container.querySelectorAll<HTMLElement>('[data-transcript-segment]'));
  if (segmentNodes.length > 0) {
    for (let i = 0; i < segmentNodes.length; i++) {
      const startTime = Number(segmentNodes[i].dataset.startTime);
      const endTime = Number(segmentNodes[i].dataset.endTime);
      if (Number.isFinite(startTime) && Number.isFinite(endTime)) {
        if (currentTime >= startTime && currentTime < endTime) return i;
      }
    }
    return Math.max(0, Math.min(segmentNodes.length - 1, Math.floor((currentTime / Math.max(1, audioDuration)) * segmentNodes.length)));
  }

  const paragraphs = Array.from(container.querySelectorAll<HTMLElement>('p'));
  if (paragraphs.length === 0) return null;

  const ratio = Number.isFinite(audioDuration) && audioDuration > 0 ? currentTime / audioDuration : 0;
  return Math.max(0, Math.min(paragraphs.length - 1, Math.floor(ratio * paragraphs.length)));
}

function seekAudioToTranscriptTarget(audio: HTMLAudioElement | null, target: HTMLElement) {
  if (!audio) return;

  const directStart = Number(target.dataset.startTime);
  if (Number.isFinite(directStart)) {
    try {
      audio.pause();
      audio.currentTime = Math.max(0, directStart);
      void audio.play().catch(() => {});
    } catch (error) {
      console.error('Failed to seek audio before play:', error);
    }
    return;
  }

  const container = target.closest('[data-transcript-panel]');
  if (!container) return;
  const items = Array.from(container.querySelectorAll<HTMLElement>('[data-transcript-segment], p'));
  const idx = items.indexOf(target);
  if (idx < 0) return;

  const duration = audio.duration || 0;
  const ratio = items.length > 1 ? idx / (items.length - 1) : 0;
  const estimated = Math.max(0, duration > 0 ? Math.min(duration - 0.1, duration * ratio) : 0);
  try {
    audio.pause();
    audio.currentTime = estimated;
    void audio.play().catch(() => {});
  } catch (error) {
    console.error('Failed to seek audio before play:', error);
  }
}

export default function ListeningReviewPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');
  const { testDetail, loading, error } = useTestDetail(id);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [activeStimulusIdx, setActiveStimulusIdx] = useState(0);
  const [activeSegmentIdx, setActiveSegmentIdx] = useState<number | null>(null);
  const loadedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const raw = sessionStorage.getItem(`practice-result-${id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ResultData;
        Promise.resolve().then(() => setResultData(parsed));
        return;
      } catch {
        /* fall through */
      }
    }

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
        setResultData({ attemptId: res.attemptId, testId: id, answers, textAnswers, elapsedSeconds: res.elapsedSeconds, explanations });
      }).catch(() => {
        router.replace(`/practice/listening/${id}`);
      });
      return;
    }

    router.replace(`/practice/listening/${id}`);
  }, [id, router, attemptIdParam]);

  // Merge API explanation/evidence into stimulus questions (must be before early returns)
  const stimuli = testDetail?.stimuli ?? [];
  const safeActiveStimulusIdx = activeStimulusIdx < stimuli.length ? activeStimulusIdx : 0;
  const rawStimulus = stimuli[safeActiveStimulusIdx] ?? null;
  const explanationsJson = resultData?.explanations ? JSON.stringify(resultData.explanations) : '';
  const stimulus = useMemo(() => {
    if (!rawStimulus || !explanationsJson) return rawStimulus;
    const explanations: Record<number, { text?: string; evidence?: string }> = JSON.parse(explanationsJson);
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
            },
          };
        }),
      })),
    };
  }, [rawStimulus, explanationsJson]) as StimulusDetail | null;

  // Audio time update handler for transcript highlighting
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      // Find the active segment based on current time
      if (!stimulus) return;
      const parsedTranscript: TranscriptLike[] = Array.isArray(stimulus.transcript) ? stimulus.transcript : [];

      if (parsedTranscript.length > 0) {
        // Find the segment that contains the current time
        let activeIdx: number | null = null;
        for (let i = 0; i < parsedTranscript.length; i++) {
          const segStartTime = Number(parsedTranscript[i].startTime) || 0;
          const segEndTime = i < parsedTranscript.length - 1 
            ? (Number(parsedTranscript[i + 1].startTime) || 0) 
            : segStartTime + 30; // Assume 30 seconds for last segment
          
          if (currentTime >= segStartTime && currentTime < segEndTime) {
            activeIdx = i;
            break;
          }
        }
        
        setActiveSegmentIdx(activeIdx);
        
        // Auto-scroll to active segment
        if (activeIdx !== null && transcriptRef.current) {
          const buttons = transcriptRef.current.querySelectorAll<HTMLButtonElement>('button[data-segment-idx]');
          const activeButton = buttons[activeIdx];
          if (activeButton) {
            activeButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return;
      }

      if (transcriptRef.current) {
        const activeContentIdx = getActiveContentSegmentIndex(transcriptRef.current, currentTime, audio.duration || 0);
        const contentSegments = Array.from(transcriptRef.current.querySelectorAll<HTMLElement>('[data-transcript-segment], p'));
        contentSegments.forEach((el, idx) => {
          const isActive = activeContentIdx === idx;
          el.classList.toggle('text-green-700', isActive);
          el.classList.toggle('font-medium', isActive);
          if (!isActive) {
            el.classList.remove('text-green-700', 'font-medium');
          }
        });
        if (activeContentIdx !== null) {
          const activeNode = contentSegments[activeContentIdx];
          activeNode?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [stimulus]);

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
  
        {stimuli.length > 1 && (
          <div className="bg-white border-b px-4 py-2 flex items-center gap-2 overflow-x-auto">
            {stimuli.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setActiveStimulusIdx(index)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors whitespace-nowrap ${
                  index === safeActiveStimulusIdx
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Section {s.section ?? index + 1}
              </button>
            ))}
          </div>
        )}
  
        {/* Audio player + Panels */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Practice-style Audio player */}
          {stimulus.mediaUrl && (
            <ListeningPracticeAudioPlayer 
              ref={audioRef}
              audioUrl={stimulus.mediaUrl}
            />
          )}
  
          <div className="flex-1 flex overflow-hidden">
            {/* Transcript panel - Now on the LEFT */}
            <div
              ref={transcriptRef}
              className="w-1/2 overflow-y-auto p-4 space-y-3 border-r"
              data-transcript
              data-transcript-panel
              onClick={(e) => {
                const target = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>('[data-transcript-segment], p, button[data-segment-idx]') : null;
                if (!target) return;
                if (target.tagName === 'BUTTON') return;
                seekAudioToTranscriptTarget(audioRef.current, target);
              }}
            >
              {(() => {
                const parsedTranscript: TranscriptLike[] = Array.isArray(stimulus.transcript) ? stimulus.transcript : [];
  
                if (parsedTranscript.length > 0) {
                  return parsedTranscript.map((seg, i) => {
                    const startTime = Number(seg.startTime) || 0;
                    const mins = Math.floor(startTime / 60);
                    const secs = Math.floor(startTime % 60);
                    const ts = `${mins}:${secs.toString().padStart(2, '0')}`;
                    const isActive = activeSegmentIdx === i;
                    return (
                      <button
                        key={seg.id || i}
                        type="button"
                        data-segment-idx={i}
                        data-start-time={startTime}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (audioRef.current) {
                            audioRef.current.currentTime = startTime;
                            audioRef.current.play().catch(() => {});
                          }
                        }}
                        className={`w-full text-left px-3 py-3 text-sm rounded-lg transition-colors group leading-relaxed ${
                          isActive
                            ? 'text-green-900'
                            : 'hover:text-green-700'
                        }`}
                      >
                        <span className={`text-[10px] font-mono mr-2 ${isActive ? 'text-green-700' : 'text-gray-500 group-hover:text-green-700'}`}>{ts}</span>
                        {seg.speaker && <span className={`text-xs font-semibold mr-1 ${isActive ? 'text-green-700' : 'text-gray-500'}`}>{seg.speaker}:</span>}
                        <span className={isActive ? 'font-medium text-green-900' : 'text-gray-700'}>{seg.text || seg.content || ''}</span>
                      </button>
                    );
                  });
                }
  
                if (stimulus.content && stimulus.content.trim()) {
                  return (
                    <div
                      className="text-gray-700 text-sm leading-relaxed max-w-none [&_p]:cursor-pointer [&_p]:transition-colors [&_p:hover]:text-green-700"
                      dangerouslySetInnerHTML={{ __html: stimulus.content }}
                    />
                  );
                }
  
                return <p className="text-sm text-gray-400 text-center py-8">Chưa có transcript cho bài nghe này.</p>;
              })()}
            </div>

            {/* Review panel (answers) - Now on the RIGHT */}
            <div className="w-1/2 overflow-hidden bg-gray-50">
              <ListeningReviewPanel
                stimulus={stimulus}
                answers={resultData.answers}
                textAnswers={resultData.textAnswers}
                onLocateEvidence={(evidence) => {
                  if (!evidence) return;
                  const container = document.querySelector('[data-transcript]');
                  if (!container) return;
                  const chunks = splitEvidenceChunks(evidence);
                  if (chunks.length === 0) return;

                  const transcriptSegments = Array.isArray(stimulus.transcript) ? stimulus.transcript : [];
                  const matchedSegments = transcriptSegments.length > 0
                    ? findTranscriptMatches(transcriptSegments, chunks)
                    : [];

                  if (matchedSegments.length > 0) {
                    const firstMatch = matchedSegments[0];
                    const firstSegment = transcriptSegments[firstMatch.segmentIndex];
                    const audio = audioRef.current;

                    container.querySelectorAll('.bg-amber-100, .ring-2, .ring-amber-400').forEach((el) => {
                      el.classList.remove('bg-amber-100', 'ring-2', 'ring-amber-400', 'rounded-sm');
                    });

                    matchedSegments.forEach(({ segmentIndex }) => {
                      const segmentEl = container.querySelector<HTMLElement>(`[data-segment-idx="${segmentIndex}"]`);
                      if (!segmentEl) return;
                      segmentEl.classList.add('bg-amber-100', 'ring-2', 'ring-amber-400', 'rounded-sm');
                    });

                    const activeElement = container.querySelector<HTMLElement>(`[data-segment-idx="${firstMatch.segmentIndex}"]`);
                    activeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    if (audio && Number.isFinite(firstSegment?.startTime)) {
                      const startTime = Math.max(0, Number(firstSegment.startTime) || 0);
                      try {
                        audio.pause();
                        audio.currentTime = startTime;
                      } catch (error) {
                        console.error('Failed to seek audio before play:', error);
                      }
                      void audio.play().catch((err) => console.error('Play failed:', err));
                    }
                    return;
                  }

                  const targets = container.querySelectorAll<HTMLElement>('[data-start-time], p, li, span');
                  const normalizedChunks = chunks.map(normalizeText).filter(Boolean);
                  if (normalizedChunks.length === 0) return;
                  const matchedTargetIndexes: number[] = [];
                  normalizedChunks.forEach((chunk) => {
                    const matchedIdx = Array.from(targets).findIndex((target) => {
                      const text = normalizeText(target.textContent || '');
                      return isChunkMatched(text, chunk);
                    });
                    if (matchedIdx >= 0) matchedTargetIndexes.push(matchedIdx);
                  });

                  if (matchedTargetIndexes.length === 0) return;

                  const uniqueIndexes = Array.from(new Set(matchedTargetIndexes)).sort((a, b) => a - b);
                  const firstIdx = matchedTargetIndexes[0];

                  container.querySelectorAll('.bg-amber-100, .ring-2, .ring-amber-400').forEach((el) => {
                    el.classList.remove('bg-amber-100', 'ring-2', 'ring-amber-400', 'rounded-sm');
                  });

                  uniqueIndexes.forEach((idx) => {
                    const target = targets[idx];
                    target?.classList.add('bg-amber-100', 'ring-2', 'ring-amber-400', 'rounded-sm');
                  });

                  const firstTarget = targets[firstIdx];
                  firstTarget?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  uniqueIndexes.forEach((idx) => {
                    const target = targets[idx];
                    if (!target) return;
                    setTimeout(() => {
                      target.classList.remove('bg-amber-100', 'ring-2', 'ring-amber-400', 'rounded-sm');
                    }, 10000);
                  });

                  let startTime: number | null = null;
                  let searchIdx = firstIdx;
                  while (searchIdx >= 0) {
                    const searchEl = targets[searchIdx];
                    const sTime = Number(searchEl.dataset.startTime);
                    if (Number.isFinite(sTime)) {
                      startTime = sTime;
                      break;
                    }
                    const tMatch = (searchEl.textContent || '').match(/(\d{1,2}):(\d{2})/);
                    if (tMatch) {
                      startTime = parseInt(tMatch[1], 10) * 60 + parseInt(tMatch[2], 10);
                      break;
                    }
                    searchIdx--;
                  }

                  // Fallback estimate when transcript has no timestamps.
                  if (startTime === null && audioRef.current && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
                    const ratio = targets.length > 1 ? firstIdx / (targets.length - 1) : 0;
                    startTime = Math.max(0, Math.min(audioRef.current.duration - 0.1, audioRef.current.duration * ratio));
                  }

                  if (audioRef.current) {
                    try {
                      audioRef.current.pause();
                      if (startTime !== null) {
                        audioRef.current.currentTime = startTime;
                      }
                    } catch (error) {
                      console.error('Failed to seek audio before play:', error);
                    }
                    void audioRef.current.play().catch((err) => console.error('Play failed:', err));
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
