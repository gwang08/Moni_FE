'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WritingScoringProgressDialog } from '@/components/writing/writing-scoring-progress-dialog';
import { WritingPromptPanel } from '@/components/writing/writing-prompt-panel';
import { useTestDetail } from '@/hooks/use-test-detail';
import { useAuthStore } from '@/store/auth-store';
import { useWritingStore } from '@/store/writing-store';
import { getWritingSubmissionDetail, type WritingSubmissionDetail } from '@/lib/ai-api';
import type { WritingTaskType } from '@/types/writing.types';

interface Props { params: Promise<{ id: string }> }

// ---------- colour helpers ----------
function bc(b: number) {
  if (b >= 8) return 'text-emerald-600';
  if (b >= 6.5) return 'text-teal-600';
  if (b >= 5) return 'text-amber-600';
  return 'text-red-500';
}
function bbg(b: number) {
  if (b >= 8) return 'bg-emerald-50 border-emerald-200/60';
  if (b >= 6.5) return 'bg-teal-50 border-teal-200/60';
  if (b >= 5) return 'bg-amber-50 border-amber-200/60';
  return 'bg-red-50 border-red-200/60';
}

// ---------- data normalisation ----------
/* eslint-disable @typescript-eslint/no-explicit-any */
function dig(o: any, ...paths: string[]): number {
  for (const p of paths) {
    let v: any = o;
    for (const k of p.split('.')) { v = v?.[k]; }
    if (typeof v === 'number') return v;
  }
  return 0;
}

interface NormalisedData {
  overall: number;
  criteria: { key: string; label: string; band: number; justification?: string; strengths?: string[]; weaknesses?: string[]; violations?: Record<string, unknown> }[];
  improvements: { criterion: string; issue_type?: string; original_sentence?: string; improved_sentence?: string; reason?: string }[];
  overall_strategy?: string;
  // expert format fields
  summary?: string;
  strengths?: string;
  feedbackImprovements?: string;
}

const CRIT_META = [
  { key: 'TA', altKeys: ['TR'], label: 'Task Achievement', short: 'TA/TR' },
  { key: 'CC', altKeys: ['CC'], label: 'Coherence & Cohesion', short: 'CC' },
  { key: 'LR', altKeys: ['LR'], label: 'Lexical Resource', short: 'LR' },
  { key: 'GRA', altKeys: ['GRA'], label: 'Grammatical Range', short: 'GRA' },
];

function normalise(raw: Record<string, unknown>): NormalisedData {
  // Determine which format we have
  // Format A (AI scoreWriting): raw.assessment + raw.feedback
  // Format B (BE saved evaluation): raw.overallScore + raw.analysisResult + raw.feedbackResponse
  const isFormatB = 'overallScore' in raw || 'analysisResult' in raw;

  const overall = isFormatB
    ? dig(raw, 'overallScore')
    : dig(raw, 'assessment.final_band', 'overallBand');

  // Criteria source
  const critSource: any = isFormatB
    ? (raw as any)?.analysisResult?.criteria
    : (raw as any)?.assessment?.criteria;

  const criteria = CRIT_META.map(({ key, altKeys, label, short }) => {
    const cObj: any = critSource?.[key] ?? altKeys.reduce((acc: any, k) => acc ?? critSource?.[k], undefined);
    const band = Number(cObj?.adjusted_band ?? cObj?.band ?? 0);
    return {
      key: short,
      label,
      band,
      justification: cObj?.justification as string | undefined,
      strengths: Array.isArray(cObj?.strengths) ? cObj.strengths as string[] : undefined,
      weaknesses: Array.isArray(cObj?.weaknesses) ? cObj.weaknesses as string[] : undefined,
      violations: cObj?.violations as Record<string, unknown> | undefined,
    };
  });

  // Feedback / improvements
  const fbObj: any = isFormatB ? raw?.feedbackResponse : raw?.feedback;
  const improvements: NormalisedData['improvements'] = Array.isArray(fbObj?.improvements)
    ? fbObj.improvements
    : [];
  const overall_strategy = typeof fbObj?.overall_strategy === 'string' ? fbObj.overall_strategy : undefined;

  return {
    overall,
    criteria,
    improvements,
    overall_strategy,
    summary: isFormatB ? String(fbObj?.summary ?? '') : undefined,
    strengths: isFormatB ? String(fbObj?.strengths ?? '') : undefined,
    feedbackImprovements: isFormatB ? String(fbObj?.improvements ?? '') : undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- sub-components ----------
function ScoreOverview({ data }: { data: NormalisedData }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Overall circle */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-200/40 shrink-0">
        <div className="w-13 h-13 rounded-full bg-white flex flex-col items-center justify-center w-[52px] h-[52px]">
          <span className={`text-lg font-black leading-none ${bc(data.overall)}`}>{data.overall.toFixed(1)}</span>
          <span className="text-[9px] text-gray-400">Band</span>
        </div>
      </div>
      {/* Criteria chips */}
      <div className="flex gap-2 flex-wrap flex-1">
        {data.criteria.map((c) => (
          <div key={c.key} className={`rounded-xl border px-3 py-1.5 ${bbg(c.band)} min-w-[72px]`}>
            <p className="text-[10px] font-semibold text-gray-500">{c.key}</p>
            <p className={`text-base font-black leading-none mt-0.5 ${bc(c.band)}`}>{c.band.toFixed(1)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CriterionTab({ c }: { c: NormalisedData['criteria'][number] }) {
  // Count active violations (non-empty arrays)
  const activeViolations = c.violations
    ? Object.entries(c.violations).filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0)
    : [];

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-3">
        <span className={`text-3xl font-black ${bc(c.band)}`}>{c.band.toFixed(1)}</span>
        <span className="text-sm text-gray-500">{c.label}</span>
      </div>
      {c.justification && (
        <p className="text-[13px] text-gray-700 leading-relaxed">{c.justification}</p>
      )}
      {c.strengths && c.strengths.length > 0 && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 space-y-1">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Điểm mạnh</p>
          {c.strengths.map((s, i) => (
            <p key={i} className="text-[12px] text-gray-700 flex gap-1.5"><span className="text-emerald-500 shrink-0">✓</span>{s}</p>
          ))}
        </div>
      )}
      {c.weaknesses && c.weaknesses.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 space-y-1">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">Điểm yếu</p>
          {c.weaknesses.map((w, i) => (
            <p key={i} className="text-[12px] text-gray-700 flex gap-1.5"><span className="text-amber-500 shrink-0">⚠</span>{w}</p>
          ))}
        </div>
      )}
      {activeViolations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-red-500 uppercase tracking-wide">Lỗi phát hiện</p>
          {activeViolations.map(([vKey, vArr]) => (
            <div key={vKey} className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-[11px] font-semibold text-red-600 mb-1">{vKey}</p>
              {(vArr as Record<string, unknown>[]).slice(0, 3).map((item, i) => {
                const evidence = item.evidence != null ? String(item.evidence) : '';
                const reason = item.reason != null ? String(item.reason) : '';
                return (
                  <div key={i} className="text-[12px] text-gray-700 mb-1.5 last:mb-0">
                    {evidence && <p className="italic text-gray-500">&ldquo;{evidence}&rdquo;</p>}
                    {reason && <p>{reason}</p>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {!c.justification && !c.strengths?.length && !c.weaknesses?.length && activeViolations.length === 0 && (
        <p className="text-[13px] text-gray-400 italic">Không có chi tiết cho tiêu chí này.</p>
      )}
    </div>
  );
}

function ImprovementsSection({ improvements }: { improvements: NormalisedData['improvements'] }) {
  if (!improvements.length) return null;
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-bold text-teal-500 uppercase tracking-wider">Gợi ý cải thiện</p>
      {improvements.map((imp, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">{imp.criterion}</Badge>
            {imp.issue_type && <span className="text-[11px] text-gray-400">{imp.issue_type}</span>}
          </div>
          {imp.original_sentence && (
            <p className="text-[12px] text-gray-500 line-through leading-relaxed">"{imp.original_sentence}"</p>
          )}
          {imp.improved_sentence && (
            <p className="text-[12px] text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1 leading-relaxed">"{imp.improved_sentence}"</p>
          )}
          {imp.reason && <p className="text-[12px] text-gray-600">{imp.reason}</p>}
        </div>
      ))}
    </div>
  );
}

// ---------- page ----------
export default function WritingResultPage({ params }: Props) {
  const { id } = use(params);
  const submissionId = Number(id);
  const router = useRouter();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { gradingResult, rawScoringData, isGrading, submitForGrading } = useWritingStore();

  const [submission, setSubmission] = useState<WritingSubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGrading, setShowGrading] = useState(false);
  const [essayOpen, setEssayOpen] = useState(true);

  const testIdStr = submission?.testId ? String(submission.testId) : '';
  const { testDetail } = useTestDetail(testIdStr);

  const fetchSubmission = useCallback(async () => {
    try {
      const data = await getWritingSubmissionDetail(submissionId);
      setSubmission(data);
    } catch {
      toast.error('Không tìm thấy bài viết');
      router.replace('/scoring-history');
    } finally {
      setLoading(false);
    }
  }, [submissionId, router]);

  useEffect(() => { fetchSubmission(); }, [fetchSubmission]);
  useEffect(() => { if (isGrading) setShowGrading(true); }, [isGrading]);

  const handleAiScore = async () => {
    if (!submission) return;
    const stimulus = testDetail?.stimuli[0];
    const rawPrompt = stimulus?.content ?? '';
    const taskType = submission.taskType === 'TASK_1' ? 1 : 2;
    const imgUrl = stimulus?.mediaUrl || rawPrompt.match(/<img[^>]+src="([^"]+)"/)?.[1];

    let chartFile: File | undefined;
    if (taskType === 1 && imgUrl) {
      try {
        const res = await fetch(imgUrl, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 0) chartFile = new File([blob], 'chart.png', { type: blob.type || 'image/png' });
        }
      } catch {
        try {
          const img = new Image(); img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = imgUrl!; });
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          canvas.getContext('2d')?.drawImage(img, 0, 0);
          const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
          if (blob && blob.size > 0) chartFile = new File([blob], 'chart.png', { type: 'image/png' });
        } catch { /* give up */ }
      }
    }

    await submitForGrading({ taskType, question: rawPrompt, answer: submission.essayContent, chartImage: chartFile, stimulusId: submission.stimulusId ?? undefined, submissionId: submission.submissionId });
    refreshProfile();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[calc(100vh-56px)]"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>;
  }
  if (!submission) return null;

  const stimulus = testDetail?.stimuli[0];
  const taskType: WritingTaskType = submission.taskType === 'TASK_1' ? 1 : 2;
  const prompt = stimulus?.content ?? '';
  const chartImageUrl = stimulus?.mediaUrl ?? undefined;
  const hasEvaluation = submission.evaluation != null;

  // Determine raw data source for rich display
  // Priority: rawScoringData (immediate score) > submission.evaluation (saved)
  const rawForDisplay: Record<string, unknown> | null =
    rawScoringData ?? (hasEvaluation ? submission.evaluation as Record<string, unknown> : null);

  const normData = rawForDisplay ? normalise(rawForDisplay) : null;
  const scored = normData !== null;

  const submittedDate = new Date(
    submission.submittedAt.includes('Z') ? submission.submittedAt : submission.submittedAt + 'Z'
  ).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/scoring-history">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold">Chi tiết bài viết</h1>
          <p className="text-xs text-muted-foreground">{submittedDate}</p>
        </div>
        <Badge variant={scored ? 'default' : 'secondary'} className={scored ? 'bg-emerald-100 text-emerald-700 border-0' : ''}>
          {scored ? 'Đã chấm điểm' : 'Chưa chấm điểm'}
        </Badge>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Prompt (40%) */}
        {prompt && (
          <div className="w-2/5 overflow-y-auto p-6 border-r border-gray-200 bg-gradient-to-b from-teal-50/40 to-emerald-50/20 shrink-0">
            <WritingPromptPanel prompt={prompt} chartImageUrl={chartImageUrl} taskType={taskType} />
          </div>
        )}

        {/* Right: Results (60%) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Score overview */}
          {normData && (
            <div className="rounded-2xl border border-teal-100/60 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-3">Tổng quan điểm số</p>
              <ScoreOverview data={normData} />
            </div>
          )}

          {/* Essay (collapsible) */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={() => setEssayOpen((o) => !o)}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-500" />
                <span className="text-sm font-bold text-gray-800">Bài viết của bạn</span>
                <Badge variant="secondary" className="text-[10px]">{submission.wordCount} từ</Badge>
              </div>
              {essayOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            {essayOpen && (
              <div className="px-4 pb-4">
                <div className="rounded-xl bg-gray-50/60 border border-gray-100 p-4">
                  <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{submission.essayContent}</p>
                </div>
              </div>
            )}
          </div>

          {/* Detailed criteria tabs */}
          {normData && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
              <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-3">Phân tích chi tiết</p>
              <Tabs defaultValue={normData.criteria[0]?.key ?? 'TA/TR'}>
                <TabsList className="grid grid-cols-4 w-full h-8 bg-gray-100/80">
                  {normData.criteria.map((c) => (
                    <TabsTrigger key={c.key} value={c.key} className="text-[11px] font-semibold">{c.key}</TabsTrigger>
                  ))}
                </TabsList>
                {normData.criteria.map((c) => (
                  <TabsContent key={c.key} value={c.key}>
                    <CriterionTab c={c} />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {/* Expert format: summary/strengths/improvements text */}
          {normData && (normData.summary || normData.strengths) && (
            <div className="space-y-3">
              {normData.summary && (
                <div className="rounded-2xl bg-teal-50/50 border border-teal-100/60 p-4">
                  <p className="text-xs font-bold text-teal-600 mb-1.5">Nhận xét tổng quan</p>
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{normData.summary}</p>
                </div>
              )}
              {normData.strengths && (
                <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100/60 p-4">
                  <p className="text-xs font-bold text-emerald-600 mb-1.5">Điểm mạnh</p>
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{normData.strengths}</p>
                </div>
              )}
              {normData.feedbackImprovements && (
                <div className="rounded-2xl bg-amber-50/50 border border-amber-100/60 p-4">
                  <p className="text-xs font-bold text-amber-600 mb-1.5">Cần cải thiện</p>
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{normData.feedbackImprovements}</p>
                </div>
              )}
            </div>
          )}

          {/* AI format: improvements list */}
          {normData && <ImprovementsSection improvements={normData.improvements} />}

          {/* Overall strategy */}
          {normData?.overall_strategy && (
            <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50/60 border border-teal-100/60 p-4">
              <p className="text-xs font-bold text-teal-600 mb-1.5">Chiến lược tổng thể</p>
              <p className="text-[13px] text-gray-700 leading-relaxed">{normData.overall_strategy}</p>
            </div>
          )}

          {/* AI score CTA */}
          {!scored && (
            <div className="flex justify-center pb-2">
              <Button
                onClick={handleAiScore}
                disabled={isGrading}
                className="gap-2 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-teal-200/50 px-6 rounded-2xl"
              >
                <Sparkles className="h-4 w-4" />
                Chấm AI ngay
              </Button>
            </div>
          )}
        </div>
      </div>

      <WritingScoringProgressDialog open={isGrading} />
    </div>
  );
}
