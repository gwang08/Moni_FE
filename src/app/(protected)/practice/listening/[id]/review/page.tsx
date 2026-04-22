'use client';

import { use, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Gauge, Check } from 'lucide-react';
import { SkeletonPractice } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ListeningReviewPanel } from '@/components/listening/listening-review-panel';
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

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function splitEvidenceChunks(evidence: string) {
  return evidence
    .split(/\n---\n|\r?\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function isChunkMatched(text: string, chunk: string) {
  const normalizedText = normalizeText(text);
  const normalizedChunk = normalizeText(chunk);
  if (!normalizedText || !normalizedChunk) return false;

  if (normalizedText.includes(normalizedChunk)) return true;

  const phrase = normalizedChunk.length > 20
    ? normalizedChunk.split(/\s+/).slice(0, 5).join(' ')
    : normalizedChunk;

  return phrase.length > 10 && normalizedText.includes(phrase);
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

export default function ListeningReviewPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');
  const { testDetail, loading, error } = useTestDetail(id);
  
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [activeStimulusIdx, setActiveStimulusIdx] = useState(0);
  const [activeSegmentIdx, setActiveSegmentIdx] = useState<number | null>(null);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  
  const loadedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const raw = sessionStorage.getItem(`practice-result-${id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ResultData;
        setResultData(parsed);
        return;
      } catch { /* fall through */ }
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
  }, [id, router, attemptIdParam]);

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

  // Handle speed menu outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync audio metadata and state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Update transcript highlighting
      if (!stimulus) return;
      const parsedTranscript: TranscriptLike[] = Array.isArray(stimulus.transcript) ? stimulus.transcript : [];
      if (parsedTranscript.length > 0) {
        let activeIdx: number | null = null;
        for (let i = 0; i < parsedTranscript.length; i++) {
          const segStartTime = Number(parsedTranscript[i].startTime) || 0;
          const segEndTime = i < parsedTranscript.length - 1 
            ? (Number(parsedTranscript[i + 1].startTime) || 0) 
            : segStartTime + 30;
          
          if (audio.currentTime >= segStartTime && audio.currentTime < segEndTime) {
            activeIdx = i;
            break;
          }
        }
        setActiveSegmentIdx(activeIdx);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    // Auto-scroll logic separated to avoid fighting with user scrolls
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Initial sync if audio is already loaded
    if (audio.readyState >= 1) handleLoadedMetadata();

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [stimulus]);

  // Handle auto-scroll separately to be more stable
  useEffect(() => {
    if (activeSegmentIdx !== null && transcriptRef.current) {
      const buttons = transcriptRef.current.querySelectorAll<HTMLElement>('[data-segment-idx]');
      const activeButton = buttons[activeSegmentIdx];
      if (activeButton) {
        const containerRect = transcriptRef.current.getBoundingClientRect();
        const rect = activeButton.getBoundingClientRect();
        const isVisible = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
        
        if (!isVisible) {
          activeButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [activeSegmentIdx]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) audio.pause();
      else await audio.play();
    } catch (err) { console.error('Play failed:', err); }
  }, [isPlaying]);

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !resultData) return <SkeletonPractice />;

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
    <div className="h-[calc(100vh-56px)] flex flex-col bg-white overflow-hidden">
      {/* ===== Header Section ===== */}
      <div className="shrink-0 bg-white z-20 relative">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Link href={`/practice/listening/${id}/result`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">{testDetail.title}</h1>
              <p className="text-[10px] text-gray-400 font-medium">Xem giải thích chi tiết</p>
            </div>
          </div>

          {/* Section Selector if multiple */}
          {stimuli.length > 1 && (
            <div className="flex items-center gap-1 bg-gray-50 p-0.5 rounded-lg border border-gray-200">
              {stimuli.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStimulusIdx(index)}
                  className={`px-3 py-1 text-[10px] rounded-md font-bold transition-all ${
                    index === safeActiveStimulusIdx
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Section {s.section ?? index + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Integrated Progress Bar */}
        <div className="relative w-full h-1 bg-gray-100 cursor-pointer group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              if (audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div
            className="absolute left-0 top-0 h-full rounded-r transition-all"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, backgroundColor: '#e95c18' }}
          />
        </div>

        {/* Audio Controls Bar */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-5">
            <span className="text-xs font-mono font-bold text-gray-500 tabular-nums min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            <div className="flex items-center gap-2 group">
              <button onClick={() => {
                const audio = audioRef.current;
                if (!audio) return;
                audio.muted = !isMuted;
                setIsMuted(!isMuted);
              }} className="text-gray-400 hover:text-gray-600 transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (audioRef.current) audioRef.current.volume = val;
                  setIsMuted(val === 0);
                }}
                className="w-20 h-1 accent-[#e95c18] cursor-pointer"
              />
            </div>
          </div>

          {/* Central Controls */}
          <div className="flex items-center gap-4">
            <button onClick={() => skip(-5)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors relative">
              <RotateCcw className="h-4 w-4" />
              <span className="absolute text-[7px] font-bold mt-0.5">5</span>
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95 shadow-md"
              style={{ backgroundColor: '#e95c18' }}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
            </button>

            <button onClick={() => skip(5)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors relative">
              <RotateCw className="h-4 w-4" />
              <span className="absolute text-[7px] font-bold mt-0.5">5</span>
            </button>
          </div>

          {/* Speed Selector */}
          <div className="relative" ref={speedMenuRef}>
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Gauge className="h-4 w-4" />
              <span className="text-xs font-bold whitespace-nowrap">Tốc độ: {playbackRate}x</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[110px] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                {PLAYBACK_RATES.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      if (audioRef.current) audioRef.current.playbackRate = rate;
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-xs text-left transition-colors flex items-center justify-between ${
                      playbackRate === rate ? 'bg-orange-50 text-[#e95c18] font-bold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {rate}x
                    {playbackRate === rate && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={stimulus.mediaUrl || undefined} preload="metadata" />

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Transcript */}
        <div
          ref={transcriptRef}
          className="w-1/2 overflow-y-auto custom-scrollbar bg-white p-8"
          data-transcript
        >
          {(() => {
            const parsedTranscript: TranscriptLike[] = Array.isArray(stimulus.transcript) ? stimulus.transcript : [];
            if (parsedTranscript.length > 0) {
              return (
                <div className="space-y-1">
                  {parsedTranscript.map((seg, i) => {
                    const startTime = Number(seg.startTime) || 0;
                    const isActive = activeSegmentIdx === i;
                    return (
                      <div
                        key={seg.id || i}
                        data-segment-idx={i}
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = startTime;
                            if (!isPlaying) audioRef.current.play().catch(() => {});
                          }
                        }}
                        className={`px-4 py-3 rounded-xl transition-all cursor-pointer group relative ${
                          isActive 
                            ? 'bg-[#fff9e6] shadow-sm ring-1 ring-yellow-200/50' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-1">
                          {seg.speaker && (
                            <span className={`text-[13px] font-black shrink-0 min-w-[80px] ${
                              isActive ? 'text-green-600' : 'text-slate-500'
                            }`}>
                              {seg.speaker}:
                            </span>
                          )}
                          <span className={`text-[14px] leading-relaxed ${
                            isActive ? 'text-green-600 font-bold' : 'text-slate-700'
                          }`}>
                            {seg.text || seg.content || ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }
            if (stimulus.content) {
              return (
                <div
                  className="prose prose-sm max-w-none text-slate-700 leading-loose [&_p]:mb-4 [&_p]:cursor-pointer [&_p:hover]:text-orange-600 [&_.evidence-highlight]:bg-yellow-100 [&_.evidence-highlight]:text-green-700 [&_.evidence-highlight]:font-bold [&_.evidence-highlight]:ring-2 [&_.evidence-highlight]:ring-yellow-400"
                  dangerouslySetInnerHTML={{ __html: stimulus.content }}
                />
              );
            }
            return <p className="text-gray-400 text-center py-20">Chưa có transcript cho bài nghe này.</p>;
          })()}
        </div>

        {/* Right Side: Questions Review */}
        <div className="w-1/2 overflow-hidden bg-gray-50 border-l border-gray-100">
          <ListeningReviewPanel
            stimulus={stimulus}
            answers={resultData.answers}
            textAnswers={resultData.textAnswers}
            onLocateEvidence={(evidence) => {
              if (!evidence) return;
              const container = transcriptRef.current;
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

                container.querySelectorAll('.evidence-highlight').forEach((el) => {
                  el.classList.remove('evidence-highlight', 'bg-yellow-100', 'ring-2', 'ring-yellow-400', 'text-green-700', 'font-bold');
                });

                matchedSegments.forEach(({ segmentIndex }) => {
                  const segmentEl = container.querySelector<HTMLElement>(`[data-segment-idx="${segmentIndex}"]`);
                  if (segmentEl) {
                    segmentEl.classList.add('evidence-highlight', 'bg-yellow-100', 'ring-2', 'ring-yellow-400', 'text-green-700', 'font-bold');
                  }
                });

                const activeElement = container.querySelector<HTMLElement>(`[data-segment-idx="${firstMatch.segmentIndex}"]`);
                activeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });

                if (audio) {
                  const startTime = Number(firstSegment?.startTime);
                  if (Number.isFinite(startTime)) {
                    audio.currentTime = Math.max(0, startTime);
                    void audio.play().catch(() => {});
                  }
                }
                return;
              }

              // Fallback for HTML content or non-matched JSON segments
              const targets = container.querySelectorAll<HTMLElement>('p, li, span, div');
              const normalizedChunks = chunks.map(normalizeText).filter(Boolean);
              if (normalizedChunks.length === 0) return;

              let firstMatchedTargetIdx = -1;
              const matchedTargets: HTMLElement[] = [];

              Array.from(targets).forEach((target, idx) => {
                const text = normalizeText(target.textContent || '');
                const isMatch = normalizedChunks.some(chunk => isChunkMatched(text, chunk));
                if (isMatch) {
                  if (firstMatchedTargetIdx === -1) firstMatchedTargetIdx = idx;
                  matchedTargets.push(target);
                }
              });

              if (matchedTargets.length > 0) {
                container.querySelectorAll('.evidence-highlight').forEach((el) => {
                  el.classList.remove('evidence-highlight', 'bg-yellow-100', 'ring-2', 'ring-yellow-400', 'text-green-700', 'font-bold');
                });

                matchedTargets.forEach(t => {
                  t.classList.add('evidence-highlight', 'bg-yellow-100', 'ring-2', 'ring-yellow-400', 'text-green-700', 'font-bold');
                });
                matchedTargets[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Try to estimate time or find nearest data-start-time
                const audio = audioRef.current;
                if (audio) {
                  let startTime: number | null = null;
                  
                  // Look for nearest timestamp in parents or previous siblings
                  let current: HTMLElement | null = matchedTargets[0];
                  while (current && current !== container) {
                    const st = Number(current.dataset.startTime);
                    if (Number.isFinite(st)) {
                      startTime = st;
                      break;
                    }
                    current = current.parentElement;
                  }

                  if (startTime === null && Number.isFinite(audio.duration)) {
                    // Rough estimate based on position in DOM
                    const ratio = firstMatchedTargetIdx / targets.length;
                    startTime = audio.duration * ratio;
                  }

                  if (startTime !== null) {
                    audio.currentTime = Math.max(0, startTime);
                    void audio.play().catch(() => {});
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
