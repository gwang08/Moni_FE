'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Sparkles, ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

function CriterionCard({ c }: { c: NormalisedData['criteria'][number] }) {
  const activeViolations = c.violations
    ? Object.entries(c.violations).filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0)
    : [];

  return (
    <div className={`rounded-2xl border p-4 ${bbg(c.band)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-black ${bc(c.band)}`}>{c.band.toFixed(1)}</span>
          <div>
            <p className="text-sm font-bold text-gray-800">{c.label}</p>
            <p className="text-[10px] text-gray-500">Band {c.band.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {c.justification && (
        <p className="text-[12px] text-gray-700 leading-relaxed mb-2">{c.justification}</p>
      )}

      {c.strengths && c.strengths.length > 0 && (
        <div className="space-y-1 mb-2">
          {c.strengths.slice(0, 2).map((s, i) => (
            <p key={i} className="text-[11px] text-gray-700 flex gap-1.5">
              <span className="text-emerald-500 shrink-0">✓</span>{s}
            </p>
          ))}
        </div>
      )}

      {c.weaknesses && c.weaknesses.length > 0 && (
        <div className="space-y-1 mb-2">
          {c.weaknesses.slice(0, 2).map((w, i) => (
            <p key={i} className="text-[11px] text-gray-700 flex gap-1.5">
              <span className="text-amber-500 shrink-0">⚠</span>{w}
            </p>
          ))}
        </div>
      )}

      {activeViolations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Lỗi thường gặp</p>
          {activeViolations.slice(0, 1).map(([, vArr]) => {
            const item = (vArr as Record<string, unknown>[])[0];
            const reason = item?.reason != null ? String(item.reason) : '';
            return reason ? (
              <p key={0} className="text-[11px] text-red-600 leading-relaxed">• {reason}</p>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

interface HighlightInfo {
  text: string;
  reason: string;
  criterion: string;
  issueType?: string;
  improvedVersion?: string;
}

function parseEssayWithHighlights(essay: string, improvements: NormalisedData['improvements']): { segments: Array<{ type: 'text' | 'highlight'; content: string | HighlightInfo }> } {
  if (!improvements.length) {
    return { segments: [{ type: 'text', content: essay }] };
  }

  const segments: Array<{ type: 'text' | 'highlight'; content: string | HighlightInfo }> = [];
  let remaining = essay;

  // Try to match original sentences in the essay
  const highlights: Array<{ index: number; length: number; info: HighlightInfo }> = [];

  for (const imp of improvements) {
    if (!imp.original_sentence) continue;
    const original = imp.original_sentence.replace(/^"|"$/g, '').trim();
    const idx = remaining.indexOf(original);
    if (idx !== -1) {
      highlights.push({
        index: idx,
        length: original.length,
        info: {
          text: original,
          reason: imp.reason || '',
          criterion: imp.criterion,
          issueType: imp.issue_type,
          improvedVersion: imp.improved_sentence?.replace(/^"|"$/g, '').trim(),
        },
      });
    }
  }

  if (highlights.length === 0) {
    return { segments: [{ type: 'text', content: essay }] };
  }

  // Sort by index
  highlights.sort((a, b) => a.index - b.index);

  // Build segments
  let lastIdx = 0;
  for (const hl of highlights) {
    if (hl.index > lastIdx) {
      segments.push({ type: 'text', content: remaining.slice(lastIdx, hl.index) });
    }
    segments.push({ type: 'highlight', content: hl.info });
    lastIdx = hl.index + hl.length;
  }
  if (lastIdx < remaining.length) {
    segments.push({ type: 'text', content: remaining.slice(lastIdx) });
  }

  return { segments };
}

function HighlightedEssay({ essay, improvements }: { essay: string; improvements: NormalisedData['improvements'] }) {
  const { segments } = parseEssayWithHighlights(essay, improvements);
  const [openDialog, setOpenDialog] = useState<number | null>(null);

  if (!segments.length || (segments.length === 1 && segments[0].type === 'text')) {
    return (
      <div className="rounded-xl bg-gray-50/60 border border-gray-100 p-4">
        <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{essay}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gray-50/60 border border-gray-100 p-4 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Info className="h-4 w-4 text-amber-500" />
        <p className="text-[11px] text-gray-600">Các đoạn được highlight là những phần cần cải thiện. Nhấn vào icon <Info className="h-3 w-3 inline" /> để xem chi tiết.</p>
      </div>
      <div className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">
        {segments.map((seg, i) => {
          if (seg.type === 'text') {
            return <span key={i}>{seg.content as string}</span>;
          }
          const hl = seg.content as HighlightInfo;
          return (
            <span
              key={i}
              className="inline bg-amber-100 border-b-2 border-amber-400 px-1 py-0.5 rounded cursor-pointer hover:bg-amber-200 transition-colors"
            >
              {hl.text}
              <Dialog open={openDialog === i} onOpenChange={(open) => setOpenDialog(open ? i : null)}>
                <DialogTrigger asChild>
                  <button className="inline-flex ml-1 align-middle hover:scale-110 transition-transform">
                    <Info className="h-3.5 w-3.5 text-amber-700 hover:text-amber-800" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{hl.criterion}</Badge>
                        {hl.issueType && <span className="text-xs text-gray-500">{hl.issueType}</span>}
                      </div>
                      <button onClick={() => setOpenDialog(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                      </button>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                      <p className="text-[10px] font-bold text-gray-600 mb-1">⚠ Vấn đề</p>
                      <p className="text-[12px] text-gray-700 leading-relaxed">{hl.reason}</p>
                    </div>
                    {hl.improvedVersion && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                        <p className="text-[10px] font-bold text-emerald-600 mb-1">✓ Gợi ý sửa</p>
                        <p className="text-[12px] text-emerald-700 leading-relaxed">{hl.improvedVersion}</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </span>
          );
        })}
      </div>
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
    <div className="h-[calc(100vh-56px)] overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
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

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Prompt at the top */}
        {prompt && (
          <div className="rounded-2xl border border-teal-100/60 bg-gradient-to-br from-teal-50/40 to-emerald-50/20 p-4">
            <WritingPromptPanel prompt={prompt} chartImageUrl={chartImageUrl || ''} taskType={taskType} />
          </div>
        )}

        {/* Score overview */}
        {normData && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-3">Tổng quan điểm số</p>
            <ScoreOverview data={normData} />
          </div>
        )}

        {/* All 4 criteria displayed directly */}
        {normData && (
          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">Phân tích chi tiết theo tiêu chí</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {normData.criteria.map((c) => (
                <CriterionCard key={c.key} c={c} />
              ))}
            </div>
          </div>
        )}

        {/* Essay with highlights */}
        {normData && normData.improvements.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-teal-500" />
              <p className="text-sm font-bold text-gray-800">Bài viết của bạn</p>
              <Badge variant="secondary" className="text-[10px]">{submission.wordCount} từ</Badge>
            </div>
            <HighlightedEssay essay={submission.essayContent} improvements={normData.improvements} />
          </div>
        ) : (
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

        {/* Overall strategy */}
        {normData?.overall_strategy && (
          <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50/60 border border-teal-100/60 p-4">
            <p className="text-xs font-bold text-teal-600 mb-1.5">Chiến lược tổng thể</p>
            <p className="text-[13px] text-gray-700 leading-relaxed">{normData.overall_strategy}</p>
          </div>
        )}

        {/* AI score CTA */}
        {!scored && (
          <div className="flex justify-center pb-4">
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

      <WritingScoringProgressDialog open={isGrading} />
    </div>
  );
}
