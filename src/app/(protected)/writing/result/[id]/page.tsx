'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Sparkles, ChevronDown, ChevronUp, Info, X, Check, AlertTriangle, XCircle } from 'lucide-react';
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
  if (b >= 6.5) return 'text-blue-600';
  if (b >= 5) return 'text-amber-600';
  return 'text-rose-600';
}
function bbg(b: number) {
  if (b >= 8) return 'bg-emerald-50/40 border-emerald-100';
  if (b >= 6.5) return 'bg-blue-50/40 border-blue-100';
  if (b >= 5) return 'bg-amber-50/40 border-amber-100';
  return 'bg-rose-50/40 border-rose-100';
}
function bbc(b: number) {
  if (b >= 8) return 'border-emerald-200';
  if (b >= 6.5) return 'border-blue-200';
  if (b >= 5) return 'border-amber-200';
  return 'border-rose-200';
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
  const isFormatB = 'overallScore' in raw || 'analysisResult' in raw || 'feedbackResponse' in raw;

  const overall = isFormatB
    ? dig(raw, 'overallScore', 'overallBand')
    : dig(raw, 'assessment.final_band', 'final_band', 'overallBand');

  // Criteria source
  const critSource: any = isFormatB
    ? ((raw as any)?.analysisResult?.criteria || (raw as any)?.criteria)
    : ((raw as any)?.assessment?.criteria || (raw as any)?.criteria);

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
  const fbObj: any = isFormatB ? (raw?.feedbackResponse || raw) : (raw?.feedback || raw);
  
  let improvements: any[] = [];
  if (Array.isArray(fbObj?.improvements)) {
    improvements = fbObj.improvements;
  } else if (typeof fbObj?.improvements === 'string' && fbObj.improvements.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(fbObj.improvements);
      if (Array.isArray(parsed)) improvements = parsed;
    } catch { /* ignore */ }
  }

  const overall_strategy = typeof fbObj?.overall_strategy === 'string' ? fbObj.overall_strategy : undefined;
  
  // feedbackImprovements should only be displayed if it is a descriptive text, not raw JSON
  let feedbackImprovements = typeof fbObj?.improvements === 'string' ? fbObj.improvements : undefined;
  if (feedbackImprovements?.trim().startsWith('[') || feedbackImprovements?.trim().startsWith('{')) {
    feedbackImprovements = undefined;
  }

  return {
    overall,
    criteria,
    improvements,
    overall_strategy,
    summary: typeof fbObj?.summary === 'string' ? fbObj.summary : undefined,
    strengths: typeof fbObj?.strengths === 'string' ? fbObj.strengths : undefined,
    feedbackImprovements,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- sub-components ----------
function ScoreOverview({ data }: { data: NormalisedData }) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
      {/* Overall Score prominent display */}
      <div className="flex flex-col items-center justify-center shrink-0">
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/20 ring-8 ring-blue-50">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
          <div className="relative w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
            <span className="text-[40px] font-extrabold tracking-tight text-blue-700 leading-none mb-1">{data.overall.toFixed(1)}</span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Band</span>
          </div>
        </div>
      </div>
      
      {/* Criteria Breakdown Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
        {data.criteria.map((c) => (
          <div key={c.key} className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${bbg(c.band)} transition-transform hover:-translate-y-1 hover:shadow-md duration-300`}>
            <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2 text-center">{c.key}</span>
            <span className={`text-2xl font-black ${bc(c.band)}`}>{c.band.toFixed(1)}</span>
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
    <div className={`group relative rounded-3xl border p-5 md:p-6 ${bbg(c.band)} transition-all hover:shadow-md overflow-hidden flex flex-col h-full bg-white/50 backdrop-blur-sm`}>
      {/* Decorative top border glow */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${c.band >= 8 ? 'bg-emerald-400' : c.band >= 6.5 ? 'bg-blue-400' : c.band >= 5 ? 'bg-amber-400' : 'bg-rose-400'} opacity-80`}></div>
      
      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="flex-1 pr-3">
          <p className="text-[15px] font-extrabold text-gray-900 tracking-tight">{c.label}</p>
          <div className="flex items-center gap-2 mt-2">
             <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${c.band >= 8 ? 'bg-emerald-100 text-emerald-700' : c.band >= 6.5 ? 'bg-blue-100 text-blue-700' : c.band >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>Band {c.band.toFixed(1)}</span>
          </div>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-sm shrink-0 border ${bbc(c.band)} rotate-3 group-hover:rotate-0 transition-transform`}>
           <span className={`text-xl font-black ${bc(c.band)}`}>{c.band.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {c.justification ? (
          <p className="text-[13.5px] text-gray-700 font-medium leading-relaxed bg-white/70 p-4 rounded-2xl border border-white/60 shadow-sm">{c.justification}</p>
        ) : (
          <p className="text-[13px] text-gray-400 italic bg-white/40 p-4 rounded-2xl border border-white/40 shadow-sm">Giám khảo không để lại nhận xét chi tiết cho tiêu chí này.</p>
        )}

        <div className="flex flex-col gap-3 mt-auto pt-3">
          {c.strengths && c.strengths.length > 0 && (
            <div className="space-y-2">
              {c.strengths.slice(0, 2).map((s, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </div>
                  <p className="text-[13px] text-gray-700 leading-snug font-medium pt-0.5">{s}</p>
                </div>
              ))}
            </div>
          )}

          {c.weaknesses && c.weaknesses.length > 0 && (
            <div className="space-y-2 mt-1 border-t border-gray-200/60 pt-3">
              {c.weaknesses.slice(0, 2).map((w, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                  </div>
                  <p className="text-[13px] text-gray-700 leading-snug font-medium pt-0.5">{w}</p>
                </div>
              ))}
            </div>
          )}

          {activeViolations.length > 0 && (
            <div className="mt-2 space-y-2 bg-rose-50/80 border border-rose-100/80 p-3 rounded-2xl shadow-sm">
              <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-widest flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> Lỗi phổ biến</p>
              {activeViolations.slice(0, 1).map(([, vArr]) => {
                const item = (vArr as Record<string, unknown>[])[0];
                const reason = item?.reason != null ? String(item.reason) : '';
                return reason ? (
                  <p key={0} className="text-[12.5px] text-rose-800 leading-relaxed font-semibold">{reason}</p>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
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

  const highlights: Array<{ index: number; length: number; info: HighlightInfo }> = [];
  
  // Track which parts of the essay are already highlighted to avoid overlap
  const usedRanges: Array<[number, number]> = [];

  for (const imp of improvements) {
    if (!imp.original_sentence) continue;
    const original = imp.original_sentence.replace(/^"|"$/g, '').trim();
    if (!original) continue;

    let searchIdx = 0;
    while (true) {
      const idx = essay.indexOf(original, searchIdx);
      if (idx === -1) break;

      // Check if this instance overlaps with any existing highlight
      const overlaps = usedRanges.some(([start, end]) => 
        (idx >= start && idx < end) || (idx + original.length > start && idx + original.length <= end)
      );

      if (!overlaps) {
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
        usedRanges.push([idx, idx + original.length]);
        break; // Found a match, move to next improvement
      }
      
      searchIdx = idx + 1;
    }
  }

  if (highlights.length === 0) {
    return { segments: [{ type: 'text', content: essay }] };
  }

  // Sort by index
  highlights.sort((a, b) => a.index - b.index);

  // Build segments
  const segments: Array<{ type: 'text' | 'highlight'; content: string | HighlightInfo }> = [];
  let lastIdx = 0;
  for (const hl of highlights) {
    if (hl.index > lastIdx) {
      segments.push({ type: 'text', content: essay.slice(lastIdx, hl.index) });
    }
    segments.push({ type: 'highlight', content: hl.info });
    lastIdx = hl.index + hl.length;
  }
  if (lastIdx < essay.length) {
    segments.push({ type: 'text', content: essay.slice(lastIdx) });
  }

  return { segments };
}

function HighlightedEssay({ essay, improvements }: { essay: string; improvements: NormalisedData['improvements'] }) {
  const { segments } = parseEssayWithHighlights(essay, improvements);
  const [openDialog, setOpenDialog] = useState<number | null>(null);

  if (!segments.length || (segments.length === 1 && segments[0].type === 'text')) {
    return (
      <div className="rounded-2xl bg-gray-50/80 border border-gray-200 p-6 md:p-8 shadow-sm">
        <p className="text-[14px] md:text-[15px] text-gray-800 leading-[1.9] whitespace-pre-wrap font-serif">{essay}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border border-gray-200 shadow-md overflow-hidden">
      <div className="bg-amber-50/80 border-b border-amber-100/60 px-5 py-4 flex items-start sm:items-center gap-3">
        <div className="bg-amber-100/80 p-2 rounded-full shrink-0 shadow-sm border border-amber-200/50">
          <Info className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-[13px] text-amber-800 leading-relaxed font-semibold">
          Các đoạn bị bôi vàng là những phần cần cải thiện. Nhấn vào biểu tượng <Info className="h-3.5 w-3.5 inline text-amber-600 mx-0.5" /> bên cạnh để xem góp ý từ chuyên gia.
        </p>
      </div>
      <div className="p-6 md:p-8 text-[14px] md:text-[15px] text-gray-800 leading-[2.1] whitespace-pre-wrap font-serif selection:bg-blue-100">
        {segments.map((seg, i) => {
          if (seg.type === 'text') {
            return <span key={i} className="text-gray-700">{seg.content as string}</span>;
          }
          const hl = seg.content as HighlightInfo;
          return (
            <span
              key={i}
              className="inline-flex items-center bg-amber-100/50 border-b-[2px] border-amber-300/80 rounded-[3px] cursor-pointer hover:bg-amber-200/60 transition-colors group relative mx-[1px]"
            >
              <span className="px-1 py-[1.5px] leading-tight">{hl.text}</span>
              <Dialog open={openDialog === i} onOpenChange={(open) => setOpenDialog(open ? i : null)}>
                <DialogTrigger asChild>
                  <button className="inline-flex items-center justify-center mx-1 outline-none text-amber-500 group-hover:text-amber-600 group-hover:scale-110 transition-all bg-amber-100 rounded-full w-5 h-5 shadow-sm">
                    <Info className="h-3 w-3" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-3xl border border-gray-100 shadow-2xl">
                  {/* Dialog Header Customization */}
                  <div className="bg-[#F8FAFC] px-6 py-4 border-b border-gray-100 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border border-indigo-100/50 hover:bg-indigo-100 font-bold tracking-wide px-3">{hl.criterion}</Badge>
                      <DialogTrigger asChild>
                        <button className="text-gray-400 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 p-1.5 rounded-full transition-all hover:bg-gray-50 focus:ring-2 ring-gray-200 outline-none">
                          <X className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                    </div>
                    {hl.issueType && <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase mt-1 px-1">{hl.issueType}</span>}
                  </div>
                  
                  <div className="p-6 space-y-6 bg-white">
                    <div className="relative pl-5">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-full bg-rose-200"></div>
                      <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Vấn đề</p>
                      <p className="text-[14px] text-gray-700 leading-relaxed font-semibold">{hl.reason}</p>
                    </div>
                    
                    {hl.improvedVersion && (
                      <div className="relative pl-5 bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100/50 shadow-sm mt-2">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-emerald-400"></div>
                        <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Gợi ý cách viết tốt hơn</p>
                        <p className="text-[14.5px] text-emerald-900 leading-relaxed font-bold">{hl.improvedVersion}</p>
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

  // Grade handler — chart data is pre-computed by Admin, no need to send chartImage
  const handleAiScore = async () => {
    if (!submission) return;
    const stimulus = testDetail?.stimuli[0];
    const rawPrompt = stimulus?.content ?? '';
    const taskType = submission.taskType === 'TASK_1' ? 1 : 2;

    await submitForGrading({
      taskType, question: rawPrompt, answer: submission.essayContent,
      stimulusId: submission.stimulusId ?? undefined, submissionId: submission.submissionId,
    });
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

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-16">
        {/* Prompt at the top */}
        {prompt && (
          <div className="rounded-3xl border border-indigo-100/60 bg-gradient-to-br from-indigo-50/40 to-blue-50/20 p-5 shadow-sm">
            <WritingPromptPanel prompt={prompt} chartImageUrl={chartImageUrl || ''} taskType={taskType} />
          </div>
        )}

        {/* Score overview */}
        {normData && (
          <div className="rounded-3xl border border-gray-100 bg-white p-7 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-8 font-sans tracking-tight">Kết quả đánh giá</h2>
            <ScoreOverview data={normData} />

            {/* Overall strategy */}
            {normData?.overall_strategy && (
              <div className="mt-8 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/40 border border-indigo-100 p-6 shadow-sm">
                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Chiến lược bứt phá</p>
                <p className="text-[14.5px] text-gray-800 leading-relaxed font-semibold">{normData.overall_strategy}</p>
              </div>
            )}
            
            {/* Expert format (fallback if missing overall_strategy) */}
            {(normData.summary || normData.strengths || normData.feedbackImprovements || (normData.improvements.length > 0 && !normData.overall_strategy)) && (
              <div className="mt-8 space-y-4">
               {normData.summary && (
                  <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Nhận xét tổng quan</p>
                    <p className="text-[14px] text-gray-700 leading-relaxed font-medium whitespace-pre-line">{normData.summary}</p>
                  </div>
                )}
                {normData.strengths && (
                  <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100/50 p-5">
                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Check className="h-4 w-4" /> Điểm mạnh</p>
                    <p className="text-[14px] text-gray-800 leading-relaxed font-medium whitespace-pre-line">{normData.strengths}</p>
                  </div>
                )}
                {/* Only render feedbackImprovements if it's a valid string and doesn't look like code. */}
                {typeof normData.feedbackImprovements === 'string' && 
                 normData.feedbackImprovements.length > 0 && 
                 !normData.feedbackImprovements.trim().startsWith('[') && (
                  <div className="rounded-2xl bg-amber-50/60 border border-amber-100/50 p-5">
                    <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Cần cải thiện</p>
                    <p className="text-[14px] text-gray-800 leading-relaxed font-medium whitespace-pre-line">{normData.feedbackImprovements}</p>
                  </div>
                )}
                {/* Fallback: if we have improvements list but no strategy/string feedback, list the reasons briefly */}
                {!normData.overall_strategy && !normData.feedbackImprovements && normData.improvements.length > 0 && (
                   <div className="rounded-2xl bg-amber-50/60 border border-amber-100/50 p-5">
                    <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Các điểm cần lưu ý</p>
                    <div className="space-y-3">
                       {normData.improvements.slice(0, 3).map((imp, idx) => (
                         <div key={idx} className="flex gap-2.5 items-start">
                            <span className="text-amber-500 font-bold mt-0.5">•</span>
                            <p className="text-[13.5px] text-gray-700 leading-snug font-medium">{imp.reason}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            )}
           </div>
        )}

        {/* All 4 criteria displayed directly */}
        {normData && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 font-sans tracking-tight px-1">Phân tích chuyên sâu</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
              {normData.criteria.map((c) => (
                <CriterionCard key={c.key} c={c} />
              ))}
            </div>
          </div>
        )}

        {/* Essay with highlights */}
        {normData && normData.improvements.length > 0 ? (
          <div className="space-y-5 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 font-sans tracking-tight flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Chữa bài chi tiết
                </h2>
                <p className="text-[13px] text-gray-500 mt-1 font-semibold">Bấm vào các phần được đánh dấu để xem gợi ý sửa đổi</p>
              </div>
              <Badge variant="outline" className="bg-white/80 border-gray-200 px-3 py-1 font-mono text-[11px] font-bold shadow-sm whitespace-nowrap text-gray-600">
                {submission.wordCount} WORDS
              </Badge>
            </div>
            <HighlightedEssay essay={submission.essayContent} improvements={normData.improvements} />
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden mt-8">
            <button
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group"
              onClick={() => setEssayOpen((o) => !o)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 group-hover:bg-blue-100 p-2.5 rounded-xl border border-blue-100/50 transition-colors">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex flex-col items-start gap-1">
                   <span className="text-[15px] font-extrabold text-gray-900">Bài viết của bạn</span>
                   <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 font-bold border-gray-200 shadow-sm">
                     {submission.wordCount} words
                   </Badge>
                </div>
              </div>
              <div className="bg-gray-50 group-hover:bg-gray-100 border border-gray-200 p-2 rounded-full transition-colors">
                {essayOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
              </div>
            </button>
            {essayOpen && (
              <div className="px-6 pb-6 pt-2">
                <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-6 md:p-8 shadow-inner">
                  <p className="text-[14px] md:text-[15px] text-gray-800 leading-[1.9] whitespace-pre-wrap font-serif">{submission.essayContent}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI score CTA */}
        {!scored && (
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 mt-6 shadow-sm">
             <div className="bg-white p-4 rounded-full shadow-sm border border-gray-100 mb-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50 opacity-50 blur-xl"></div>
                <Sparkles className="h-8 w-8 text-blue-600 relative z-10" />
             </div>
             <h3 className="text-xl font-extrabold text-gray-900 mb-3 text-center tracking-tight">Chấm điểm bài viết với AI</h3>
             <p className="text-[14px] text-gray-600 text-center max-w-md mb-8 leading-relaxed font-medium">AI sẽ cung cấp cho bạn band điểm dự kiến, phân tích chi tiết theo 4 tiêu chí của IELTS và chữa lỗi trực tiếp trên bài làm của bạn.</p>
            <Button
              onClick={handleAiScore}
              disabled={isGrading}
              size="lg"
              className="gap-2.5 bg-gray-900 hover:bg-gray-800 text-white shadow-xl shadow-gray-900/10 px-8 py-6 rounded-full font-bold text-[15px] transition-all hover:-translate-y-0.5"
            >
              <Sparkles className="h-5 w-5 text-amber-300" />
              Bắt đầu chấm điểm
            </Button>
          </div>
        )}
      </div>

      <WritingScoringProgressDialog open={isGrading} />
    </div>
  );
}
