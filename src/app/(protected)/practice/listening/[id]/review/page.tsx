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
  }, [rawStimulus, explanationsJson]);

  // Audio time update handler for transcript highlighting
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      // Find the active segment based on current time
      let parsedTranscript: any[] = [];
      if (Array.isArray(stimulus.transcript)) {
        parsedTranscript = stimulus.transcript;
      } else if (stimulus && 'transcript' in stimulus && typeof (stimulus as any).transcript === 'string' && (stimulus as any).transcript.trim()) {
        try {
          parsedTranscript = JSON.parse((stimulus as any).transcript);
        } catch {
          // Ignore
        }
      }

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
            <div ref={transcriptRef} className="w-1/2 overflow-y-auto p-4 space-y-1 border-r" data-transcript>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 sticky top-0 bg-white py-1 z-10">Transcript</h4>
              {(() => {
                let parsedTranscript: any[] = [];
                if (Array.isArray(stimulus.transcript)) {
                  parsedTranscript = stimulus.transcript;
                } else if (stimulus && 'transcript' in stimulus && typeof (stimulus as any).transcript === 'string' && (stimulus as any).transcript.trim()) {
                  try {
                    parsedTranscript = JSON.parse((stimulus as any).transcript);
                  } catch {
                    // Ignore
                  }
                }
  
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
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors group ${
                          isActive 
                            ? 'bg-violet-100 ring-2 ring-violet-400 text-violet-900' 
                            : 'hover:bg-violet-50'
                        }`}
                      >
                        <span className={`text-[10px] font-mono mr-2 ${isActive ? 'text-violet-700' : 'text-violet-500 group-hover:text-violet-700'}`}>{ts}</span>
                        {seg.speaker && <span className={`text-xs font-semibold mr-1 ${isActive ? 'text-violet-700' : 'text-gray-500'}`}>{seg.speaker}:</span>}
                        <span className={isActive ? 'font-medium' : 'text-gray-700'}>{seg.text || seg.content || ''}</span>
                      </button>
                    );
                  });
                }
  
                if (stimulus.content && stimulus.content.trim()) {
                  return (
                    <div
                      className="text-gray-700 text-sm leading-relaxed max-w-none"
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
                  
                  // Clear previous highlights
                  container.querySelectorAll('.ring-amber-400').forEach((el) => {
                    el.classList.remove('bg-amber-100', 'ring-2', 'ring-amber-400');
                  });
                  
                  const targets = container.querySelectorAll<HTMLElement>('[data-start-time], p, li, span');
                  const chunks = evidence.split(/\n---\n|\r?\n/).map(c => c.trim().toLowerCase()).filter(Boolean);
                  if (chunks.length === 0) return;
  
                  let matchFound = false;
                  for (let i = 0; i < targets.length; i++) {
                    const el = targets[i];
                    const rawText = (el.textContent || '');
                    const text = rawText.toLowerCase().replace(/\s+/g, ' ');
                    
                    const matched = chunks.some(chunk => {
                      const cleanChunk = chunk.replace(/\s+/g, ' ');
                      if (cleanChunk.length < 2) return false;
                      if (text.includes(cleanChunk)) return true;
                      if (cleanChunk.length > 20) {
                        const words = cleanChunk.split(/\s+/).slice(0, 5).join(' ');
                        if (words.length > 10 && text.includes(words)) return true;
                      }
                      return false;
                    });
  
                  if (matched) {
                    matchFound = true;
                    console.log('Match found in element!', rawText);
                    
                    // Resolve startTime
                    let startTime: number | null = null;
                    
                    // 1. Try to find timestamp in the matched element OR its preceding siblings
                    let searchIdx = i;
                    while (searchIdx >= 0) {
                      const searchEl = targets[searchIdx];
                      const sTime = Number(searchEl.dataset.startTime);
                      if (Number.isFinite(sTime)) {
                        startTime = sTime;
                        console.log('Found startTime from dataset:', startTime, 'at index', searchIdx);
                        break;
                      }
                      const tMatch = (searchEl.textContent || '').match(/(\d{1,2}):(\d{2})/);
                      if (tMatch) {
                        startTime = parseInt(tMatch[1], 10) * 60 + parseInt(tMatch[2], 10);
                        console.log('Found startTime from text match:', startTime, 'at index', searchIdx);
                        break;
                      }
                      searchIdx--;
                    }
  
                    if (startTime !== null && audioRef.current) {
                      console.log('Jumping to audio time:', startTime);
                      audioRef.current.currentTime = startTime;
                      setTimeout(() => {
                        console.log('Triggering audio play...');
                        audioRef.current?.play().catch(err => console.error('Play failed:', err));
                      }, 100);
                    } else {
                      console.log('Could not resolve startTime for jump.');
                    }
                    
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('bg-amber-100', 'ring-2', 'ring-amber-400', 'rounded-sm');
                    setTimeout(() => el.classList.remove('bg-amber-100', 'ring-2', 'ring-amber-400', 'rounded-sm'), 10000);
                    break;
                  }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
