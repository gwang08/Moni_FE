'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Calendar, UserCheck, Headphones, Sparkles, BookOpen, Captions } from 'lucide-react';
import { SessionTranscriptViewer } from '@/components/video/session-transcript-viewer';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { getMySessions, getSessionEvaluation } from '@/lib/expert-api';
import { getSpeakingSubmission } from '@/lib/ai-api';
import type { SpeakingSubmissionDetailResponse } from '@/lib/ai-api';
import type { ExpertEvaluation, ScoringSession } from '@/types/expert.types';
import type { EvaluationEvent, EvaluationFeedback } from '@/types/speaking-exam.types';
import type { RecordedAnswer } from '@/hooks/use-session-recorder';
import { ExamEvaluationResult } from '@/components/speaking-exam/exam-evaluation-result';
import { ResultHero } from '@/components/score-result/hero';
import { ResultInsights } from '@/components/score-result/insights';
import { ResultCriteriaDetail } from '@/components/score-result/criteria-detail';
import type { NormalisedCriterion, NormalisedData } from '@/components/score-result/normalise';

interface Props {
  params: Promise<{ sessionId: string }>;
}

// 4 tiêu chí Speaking (khác Writing về key/label)
const SPEAKING_CRITERIA: { key: keyof ExpertEvaluation; short: string; label: string }[] = [
  { key: 'fluency', short: 'FC', label: 'Fluency & Coherence' },
  { key: 'vocabulary', short: 'LR', label: 'Lexical Resource' },
  { key: 'grammar', short: 'GRA', label: 'Grammatical Range' },
  { key: 'pronunciation', short: 'PR', label: 'Pronunciation' },
];

function fmtDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Parse compiled expert feedback ([NHẬN XÉT CHUNG] + [ĐÁNH GIÁ CHI TIẾT]) thành general + per-criterion map
function parseFeedback(raw: string) {
  const general = raw.match(/\[NHẬN XÉT CHUNG\]\n([\s\S]*?)(?=\n\n\[ĐÁNH GIÁ CHI TIẾT\]|$)/);
  const detail = raw.split('[ĐÁNH GIÁ CHI TIẾT]')[1] ?? '';
  const perCrit: Record<string, string> = {};
  for (const { key, label } of SPEAKING_CRITERIA) {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`- ${esc}[^\\n]*?:\\n([\\s\\S]*?)(?=\\n- |$)`);
    const m = detail.match(re);
    if (m?.[1] && m[1].trim() !== 'Không có nhận xét thêm') perCrit[key as string] = m[1].trim();
  }
  return { general: general?.[1]?.trim() || (detail ? '' : raw), perCrit };
}

// Chuyển ExpertEvaluation speaking sang NormalisedData để tái sử dụng Hero/Insights/Accordion
function buildNormalised(evaluation: ExpertEvaluation, perCrit: Record<string, string>, general: string): NormalisedData {
  const criteria: NormalisedCriterion[] = SPEAKING_CRITERIA.map((c) => ({
    key: c.short,
    label: c.label,
    band: Number(evaluation[c.key] ?? 0),
    justification: perCrit[c.key as string],
  }));
  return {
    overall: evaluation.overallScore ?? 0,
    criteria,
    improvements: [],
    overall_strategy: undefined,
    summary: general || undefined,
    strengths: evaluation.strengths ?? undefined,
    feedbackImprovements: evaluation.areasForImprovement ?? undefined,
  };
}

// ── Convert AI submission data to EvaluationEvent (for ExamEvaluationResult) ──
function buildEvaluationEvent(sub: SpeakingSubmissionDetailResponse): EvaluationEvent {
  const eval_ = sub.evaluation;
  const analysis = (eval_?.analysisResult ?? {}) as Record<string, unknown>;
  const feedbackRaw = (eval_?.feedbackResponse ?? {}) as Record<string, unknown>;

  const criteriaMap = (analysis.criteria ?? {}) as Record<string, {
    band?: number;
    adjusted_band?: number;
    strengths?: string[];
    weaknesses?: string[];
    justification?: string;
    criterion?: string;
  }>;

  const fc = criteriaMap['FC'] ?? {};
  const lr = criteriaMap['LR'] ?? {};
  const gra = criteriaMap['GRA'] ?? {};
  const pr = criteriaMap['PR'] ?? {};

  const feedback: EvaluationFeedback = {
    summary: (feedbackRaw.summary as string) ?? '',
    strengths: (feedbackRaw.strengths as string[]) ?? [],
    areas_for_improvement: (feedbackRaw.areas_for_improvement as string[]) ?? [],
    next_steps: (feedbackRaw.next_steps as string[]) ?? [],
  };

  // Build per-criterion detail matching ExamEvaluationResult's expected shape
  const criteriaDetail: Record<string, {
    criterion: string;
    adjusted_band: number;
    strengths: string[];
    weaknesses: string[];
    justification: string;
  }> = {};

  for (const [key, obj] of Object.entries(criteriaMap)) {
    criteriaDetail[key] = {
      criterion: obj.criterion ?? key,
      adjusted_band: Number(obj.adjusted_band ?? obj.band ?? 0),
      strengths: obj.strengths ?? [],
      weaknesses: obj.weaknesses ?? [],
      justification: obj.justification ?? '',
    };
  }

  return {
    type: 'evaluation',
    final_band: eval_?.overallScore ?? 0,
    fluency: Number(fc.adjusted_band ?? fc.band ?? 0),
    vocabulary: Number(lr.adjusted_band ?? lr.band ?? 0),
    grammar: Number(gra.adjusted_band ?? gra.band ?? 0),
    pronunciation: Number(pr.adjusted_band ?? pr.band ?? 0),
    criteria: criteriaDetail,
    feedback,
    transcript: sub.audioTranscript ?? '',
  };
}

// ── Parse the raw transcript format to RecordedAnswer[] ──
function parseTranscriptToRecordings(
  transcript: string,
  audioUrlsJson?: string,
  audioDurationsJson?: string,
): RecordedAnswer[] {
  const recordings: RecordedAnswer[] = [];

  let audioUrls: (string | null)[] = [];
  if (audioUrlsJson) {
    try {
      audioUrls = JSON.parse(audioUrlsJson);
    } catch { /* ignore */ }
  }

  let durations: number[] = [];
  if (audioDurationsJson) {
    try {
      durations = JSON.parse(audioDurationsJson);
    } catch { /* ignore */ }
  }

  let audioIdx = 0;

  // Parse format: === PART N ===\nQN [question text]: answer\n
  const parts = transcript.split(/===\s*PART\s*(\d)\s*===/);
  // parts: ['', '1', 'content', '2', 'content', '3', 'content']

  for (let i = 1; i < parts.length; i += 2) {
    const partNum = parseInt(parts[i], 10);
    const content = parts[i + 1]?.trim() ?? '';

    if (partNum === 2) {
      // Part 2 is a single long answer
      const topicMatch = content.match(/\[Topic:\s*([^\]]+)\]/);
      const topic = topicMatch?.[1] ?? 'Part 2';
      const answer = content.replace(/\[Topic:[^\]]+\]\s*/, '').trim();

      recordings.push({
        part: 2,
        questionText: topic,
        transcript: answer || '[Không có câu trả lời]',
        audioUrl: audioUrls[audioIdx] ?? '',
        durationMs: durations[audioIdx] ?? 0,
      });
      audioIdx++;
    } else {
      // Part 1 and 3 - parse Q lines
      const lines = content.split('\n');
      for (const line of lines) {
        const qMatch = line.match(/^Q\d+\s*\[([^\]]+)\]:\s*(.*)/);
        if (qMatch) {
          recordings.push({
            part: partNum,
            questionText: qMatch[1],
            transcript: qMatch[2].trim() || '[Không có câu trả lời]',
            audioUrl: audioUrls[audioIdx] ?? '',
            durationMs: durations[audioIdx] ?? 0,
          });
          audioIdx++;
        }
      }
    }
  }

  return recordings;
}

export default function SpeakingResultPage({ params }: Props) {
  const { sessionId } = use(params);
  const sid = Number(sessionId);
  const router = useRouter();

  const [session, setSession] = useState<ScoringSession | null>(null);
  const [evaluation, setEvaluation] = useState<ExpertEvaluation | null>(null);
  const [aiSubmission, setAiSubmission] = useState<SpeakingSubmissionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Try expert sessions first
        const [sessions, ev] = await Promise.all([
          getMySessions().catch(() => [] as ScoringSession[]),
          getSessionEvaluation(sid).catch(() => null),
        ]);
        const found = sessions.find((s) => s.id === sid) ?? null;
        setSession(found);
        setEvaluation(ev);

        // If not found in expert system, try AI speaking submissions
        if (!found && !ev) {
          const aiSub = await getSpeakingSubmission(sid);
          if (aiSub) {
            setAiSubmission(aiSub);
          } else {
            toast.error('Không tìm thấy phiên');
            router.replace('/scoring-history');
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [sid, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // ── AI Submission path — reuse ExamEvaluationResult ──
  if (aiSubmission) {
    const evaluationEvent = buildEvaluationEvent(aiSubmission);
    const recordings = parseTranscriptToRecordings(
      aiSubmission.audioTranscript ?? '',
      aiSubmission.audioUrl,
      aiSubmission.audioDurationsMs,
    );
    const testTitle = aiSubmission.test?.title ?? 'Speaking Test';

    return (
      <div className="h-[calc(100vh-56px)] overflow-y-auto bg-[#fcf9f5]">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <Link href="/scoring-history">
            <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold">{testTitle}</h1>
            <p className="text-xs text-muted-foreground">
              AI Chấm · {fmtDate(aiSubmission.submittedAt)}
            </p>
          </div>
          <Badge
            variant="default"
            className={
              aiSubmission.evaluationStatus === 'COMPLETED'
                ? 'bg-emerald-100 text-emerald-700 border-0'
                : ''
            }
          >
            {aiSubmission.evaluationStatus === 'COMPLETED' ? 'Đã chấm điểm' : aiSubmission.evaluationStatus}
          </Badge>
        </div>

        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-16">
          <ExamEvaluationResult
            evaluation={evaluationEvent}
            recordings={recordings}
            title={testTitle}
          />
        </div>
      </div>
    );
  }

  // ── Expert Session path (original logic) ──
  const createdAt = evaluation?.createdAt ?? session?.createdAt;
  const expertName = evaluation?.expertName ?? session?.expertDisplayName;
  const { general, perCrit } = parseFeedback(evaluation?.feedback ?? '');
  const normData = evaluation ? buildNormalised(evaluation, perCrit, general) : null;

  const metaItems = [
    createdAt ? { icon: <Calendar className="h-3.5 w-3.5" />, text: fmtDate(createdAt) } : null,
    expertName ? { icon: <UserCheck className="h-3.5 w-3.5" />, text: `GV: ${expertName}` } : null,
    session?.testTitle ? { icon: <BookOpen className="h-3.5 w-3.5" />, text: session.testTitle } : null,
  ].filter(Boolean) as Array<{ icon: React.ReactNode; text: string }>;

  return (
    <div className="h-[calc(100vh-56px)] overflow-y-auto bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/scoring-history">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold">Chi tiết phiên Speaking</h1>
          <p className="text-xs text-muted-foreground">Phiên #{sid}</p>
        </div>
        <Badge
          variant={evaluation ? 'default' : 'secondary'}
          className={evaluation ? 'bg-emerald-100 text-emerald-700 border-0' : ''}
        >
          {evaluation ? 'Đã chấm điểm' : 'Chưa chấm điểm'}
        </Badge>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 pb-16">
        {normData && (
          <ResultHero
            overall={normData.overall}
            criteria={normData.criteria}
            skillChipLabel={`Speaking · Phiên #${sid}`}
            title="Kết quả đánh giá Speaking"
            metaItems={metaItems}
          />
        )}

        {normData && <ResultInsights data={normData} />}

        {normData && <ResultCriteriaDetail criteria={normData.criteria} />}

        {/* Bản ghi — đặc thù của Speaking */}
        {(session?.recordingUrl || session?.expertRecordingUrl) && (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Headphones className="h-4 w-4 text-teal-600" />
              <h3 className="text-[14px] font-extrabold text-slate-900">Bản ghi phiên</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {session?.recordingUrl && <RecordingCard label="Bạn" emoji="🎙️" src={session.recordingUrl} />}
              {session?.expertRecordingUrl && (
                <RecordingCard label="Giảng viên" emoji="🎧" src={session.expertRecordingUrl} />
              )}
            </div>
          </div>
        )}

        {/* Phụ đề tự động — đặc thù của Speaking */}
        {session?.id && (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Captions className="h-4 w-4 text-violet-600" />
              <h3 className="text-[14px] font-extrabold text-slate-900">Phụ đề tự động</h3>
            </div>
            <div className="p-5">
              <SessionTranscriptViewer sessionId={Number(session.id)} />
            </div>
          </div>
        )}

        {/* Fallback khi chưa chấm */}
        {!evaluation && (
          <div className="rounded-3xl border-2 border-dashed border-teal-200 bg-gradient-to-br from-teal-50/60 to-emerald-50/30 p-12 text-center">
            <Sparkles className="h-10 w-10 text-teal-600 mx-auto mb-4" />
            <p className="text-[15px] font-bold text-slate-800">Chưa có đánh giá</p>
            <p className="text-[13px] text-slate-500 mt-1">Phiên này chưa được giảng viên chấm. Vui lòng quay lại sau.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecordingCard({ label, emoji, src }: { label: string; emoji: string; src: string }) {
  return (
    <div className="rounded-2xl bg-slate-50/80 border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[18px]">{emoji}</span>
        <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
          {label}
        </span>
      </div>
      <audio controls src={src} className="w-full" />
    </div>
  );
}
