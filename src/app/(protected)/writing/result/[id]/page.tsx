'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GradingModal } from '@/components/writing/grading-modal';
import { WritingPromptPanel } from '@/components/writing/writing-prompt-panel';
import { useTestDetail } from '@/hooks/use-test-detail';
import { useAuthStore } from '@/store/auth-store';
import { useWritingStore } from '@/store/writing-store';
import { getWritingSubmissionDetail, type WritingSubmissionDetail } from '@/lib/ai-api';
import type { WritingTaskType } from '@/types/writing.types';

interface Props {
  params: Promise<{ id: string }>;
}

function bandColor(band: number): string {
  if (band >= 8) return 'text-emerald-600';
  if (band >= 6.5) return 'text-teal-600';
  if (band >= 5) return 'text-amber-600';
  return 'text-red-500';
}

function bandBg(band: number): string {
  if (band >= 8) return 'bg-emerald-50 border-emerald-200/60';
  if (band >= 6.5) return 'bg-teal-50 border-teal-200/60';
  if (band >= 5) return 'bg-amber-50 border-amber-200/60';
  return 'bg-red-50 border-red-200/60';
}

const CRITERIA = [
  { key: 'TA', altKey: 'TR', label: 'Task Achievement', short: 'TA/TR' },
  { key: 'CC', altKey: 'CC', label: 'Coherence & Cohesion', short: 'CC' },
  { key: 'LR', altKey: 'LR', label: 'Lexical Resource', short: 'LR' },
  { key: 'GRA', altKey: 'GRA', label: 'Grammatical Range', short: 'GRA' },
];

function getCriterionBand(assessment: Record<string, unknown>, key: string, altKey: string): number {
  const criteria = assessment?.criteria as Record<string, Record<string, unknown>> | undefined;
  if (!criteria) return 0;
  const c = criteria[key] ?? criteria[altKey];
  if (!c) return 0;
  return Number(c.adjusted_band ?? c.band ?? 0);
}

function extractFeedback(data: Record<string, unknown>): string {
  const fb = data as Record<string, unknown>;
  if (typeof fb?.overall_strategy === 'string') return fb.overall_strategy;
  if (Array.isArray(fb?.improvements)) {
    return (fb.improvements as Array<Record<string, string>>)
      .map((imp) => `[${imp.criterion}] ${imp.reason}`)
      .join('\n');
  }
  if (typeof fb?.summary === 'string') return fb.summary;
  return '';
}

export default function WritingResultPage({ params }: Props) {
  const { id } = use(params);
  const submissionId = Number(id);
  const router = useRouter();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { gradingResult, isGrading, submitForGrading } = useWritingStore();

  const [submission, setSubmission] = useState<WritingSubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGrading, setShowGrading] = useState(false);
  // Store inline result from scoreWriting response (since BE creates new submission)
  const [inlineResult, setInlineResult] = useState<Record<string, unknown> | null>(null);

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

  // Show grading modal when scoring starts
  useEffect(() => {
    if (isGrading) setShowGrading(true);
  }, [isGrading]);

  const handleAiScore = async () => {
    if (!submission) return;
    const stimulus = testDetail?.stimuli[0];
    const prompt = stimulus?.content ?? '';
    const taskType = submission.taskType === 'TASK_1' ? 1 : 2;
    const chartImageUrl = stimulus?.mediaUrl || prompt.match(/<img[^>]+src="([^"]+)"/)?.[1];

    let chartFile: File | undefined;
    if (taskType === 1 && chartImageUrl) {
      try {
        const res = await fetch(chartImageUrl);
        const blob = await res.blob();
        chartFile = new File([blob], 'chart.png', { type: blob.type || 'image/png' });
      } catch { /* proceed without chart */ }
    }

    await submitForGrading({
      taskType,
      question: prompt,
      answer: submission.essayContent,
      chartImage: chartFile,
      stimulusId: submission.stimulusId ?? undefined,
    });
    refreshProfile();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!submission) return null;

  const stimulus = testDetail?.stimuli[0];
  const taskType: WritingTaskType = submission.taskType === 'TASK_1' ? 1 : 2;
  const prompt = stimulus?.content ?? '';
  const chartImageUrl = stimulus?.mediaUrl || prompt.match(/<img[^>]+src="([^"]+)"/)?.[1];
  const hasEvaluation = submission.evaluation != null;
  // Use inline result from grading or saved evaluation
  const displayResult = (gradingResult as Record<string, unknown> | null) || (hasEvaluation ? submission.evaluation as Record<string, unknown> : null);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/scoring-history">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="font-bold">Chi tiết bài viết</h1>
          <p className="text-xs text-muted-foreground">
            {displayResult ? 'Kết quả chấm điểm' : 'Chưa chấm điểm'}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Prompt */}
        {prompt && (
          <div className="w-2/5 overflow-y-auto p-6 border-r border-gray-200 bg-gradient-to-b from-teal-50/40 to-emerald-50/20 shrink-0">
            <WritingPromptPanel prompt={prompt} chartImageUrl={chartImageUrl} taskType={taskType} />
          </div>
        )}

        {/* Center: Essay + scores */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-teal-500" />
              <span className="font-medium text-gray-800">{submission.wordCount}</span> từ
            </div>
            <span className="text-xs text-gray-400">
              {new Date(submission.submittedAt.includes('Z') ? submission.submittedAt : submission.submittedAt + 'Z')
                .toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Essay */}
          <div>
            <p className="text-xs font-bold text-teal-500 uppercase tracking-wider mb-3">Bài viết của bạn</p>
            <div className="rounded-2xl bg-white border border-teal-100/60 p-5 shadow-sm">
              <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{submission.essayContent}</p>
            </div>
          </div>

          {/* Score display OR score button */}
          {displayResult ? (
            <ScoreDisplay result={displayResult} />
          ) : (
            <div className="flex justify-center">
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

      {/* Grading modal (chibi loading) */}
      <GradingModal
        isOpen={showGrading}
        onClose={() => setShowGrading(false)}
        result={gradingResult}
        isLoading={isGrading}
      />
    </div>
  );
}

function ScoreDisplay({ result }: { result: Record<string, unknown> }) {
  // Handle both GradingResult (from store) and evaluation from API
  const assessment = (result.assessment ?? result) as Record<string, unknown>;
  const feedback = (result.feedback ?? result) as Record<string, unknown>;
  const overallBand = Number(assessment.final_band ?? (result as Record<string, unknown>).overallBand ?? assessment.overallScore ?? 0);
  const feedbackText = extractFeedback(feedback);

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-teal-500 uppercase tracking-wider">Kết quả chấm điểm</p>

      {/* Overall */}
      <div className="flex flex-col items-center py-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-200/50">
          <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center">
            <span className={`text-2xl font-black ${bandColor(overallBand)}`}>{overallBand.toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">Overall</span>
          </div>
        </div>
      </div>

      {/* Criteria */}
      <div className="grid grid-cols-2 gap-2">
        {CRITERIA.map(({ key, altKey, label, short }) => {
          const score = getCriterionBand(assessment, key, altKey);
          return (
            <div key={key} className={`rounded-2xl border p-3 ${bandBg(score)}`}>
              <p className="text-[11px] font-semibold text-gray-500 mb-0.5">{short}</p>
              <p className={`text-xl font-black ${bandColor(score)}`}>{score.toFixed(1)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {feedbackText && (
        <div className="rounded-2xl bg-teal-50/50 border border-teal-100/60 p-4">
          <p className="text-xs font-bold text-teal-600 mb-2">Nhận xét</p>
          <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{feedbackText}</p>
        </div>
      )}
    </div>
  );
}
