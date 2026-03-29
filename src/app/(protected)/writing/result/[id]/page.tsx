'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { WritingPromptPanel } from '@/components/writing/writing-prompt-panel';
import { useTestDetail } from '@/hooks/use-test-detail';
import { getWritingSubmissionDetail, scoreWriting, type WritingSubmissionDetail } from '@/lib/ai-api';
import type { WritingTaskType } from '@/types/writing.types';

interface Props {
  params: Promise<{ id: string }>;
}

// --- Score display helpers ---
const CRITERIA = [
  { key: 'TA', label: 'Task Achievement', short: 'TA/TR' },
  { key: 'CC', label: 'Coherence & Cohesion', short: 'CC' },
  { key: 'LR', label: 'Lexical Resource', short: 'LR' },
  { key: 'GRA', label: 'Grammatical Range', short: 'GRA' },
];

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

function getScore(analysisResult: Record<string, unknown>, key: string): number {
  const val = analysisResult[key];
  if (typeof val === 'number') return val;
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const score = obj['band'] ?? obj['score'] ?? obj['final_band'];
    return typeof score === 'number' ? score : 0;
  }
  return 0;
}

function getFeedbackText(feedbackResponse: Record<string, unknown>): string {
  const summary = feedbackResponse['summary'] ?? feedbackResponse['overall_feedback'] ?? feedbackResponse['feedback'];
  if (typeof summary === 'string') return summary;
  if (Array.isArray(summary)) return summary.join('\n');
  return '';
}

// --- Sub-components ---

function ScorePanel({
  evaluation,
}: {
  evaluation: NonNullable<WritingSubmissionDetail['evaluation']>;
}) {
  const { overallScore, analysisResult, feedbackResponse } = evaluation;
  const feedbackText = getFeedbackText(feedbackResponse);

  return (
    <div className="space-y-4">
      {/* Overall band */}
      <div className="flex flex-col items-center py-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-200/50">
          <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center">
            <span className={`text-2xl font-black ${bandColor(overallScore)}`}>
              {overallScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Overall</span>
          </div>
        </div>
      </div>

      {/* Criteria grid */}
      <div className="grid grid-cols-2 gap-2">
        {CRITERIA.map(({ key, label, short }) => {
          const score = getScore(analysisResult, key);
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
          <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">
            {feedbackText}
          </p>
        </div>
      )}
    </div>
  );
}

// --- Main page ---

export default function WritingResultPage({ params }: Props) {
  const { id } = use(params);
  const submissionId = Number(id);
  const router = useRouter();

  const [submission, setSubmission] = useState<WritingSubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);

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

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleAiScore = async () => {
    if (!submission) return;
    setScoring(true);
    try {
      const stimulus = testDetail?.stimuli[0];
      const prompt = stimulus?.content ?? '';
      const taskType = submission.taskType === 'TASK_1' ? 1 : 2;
      await scoreWriting({
        taskType,
        question: prompt,
        answer: submission.essayContent,
        stimulusId: submission.stimulusId ?? undefined,
      });
      toast.success('Chấm điểm thành công!');
      setLoading(true);
      await fetchSubmission();
    } catch {
      toast.error('Chấm điểm thất bại. Vui lòng thử lại.');
    } finally {
      setScoring(false);
    }
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
  const chartImageUrl = stimulus?.mediaUrl ?? undefined;
  const isCompleted = submission.evaluationStatus === 'COMPLETED';

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/scoring-history">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-bold">Chi tiết bài viết</h1>
          <p className="text-xs text-muted-foreground">
            {isCompleted ? 'Kết quả chấm điểm' : 'Chưa chấm điểm'}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Prompt */}
        {prompt && (
          <div className="w-2/5 overflow-y-auto p-6 border-r border-gray-200 bg-gradient-to-b from-teal-50/40 to-emerald-50/20 shrink-0">
            <WritingPromptPanel
              prompt={prompt}
              chartImageUrl={chartImageUrl}
              taskType={taskType}
            />
          </div>
        )}

        {/* Center: Essay */}
        <div className={`flex flex-col overflow-hidden ${isCompleted ? 'flex-1' : prompt ? 'flex-1' : 'w-full'}`}>
          {/* Meta bar */}
          <div className="shrink-0 px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-teal-500" />
              <span className="font-medium text-gray-800">{submission.wordCount}</span>
              <span>từ</span>
            </div>
            <span className="text-xs text-gray-400">
              {new Date(
                submission.submittedAt.includes('Z') || submission.submittedAt.includes('+')
                  ? submission.submittedAt
                  : submission.submittedAt + 'Z'
              ).toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Essay content */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-xs font-bold text-teal-500 uppercase tracking-wider mb-3">
              Bài viết của bạn
            </p>
            <div className="rounded-2xl bg-white border border-teal-100/60 p-5 shadow-sm">
              <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                {submission.essayContent}
              </p>
            </div>

            {/* Score AI button for unscored */}
            {!isCompleted && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleAiScore}
                  disabled={scoring}
                  className="gap-2 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-teal-200/50 px-6 rounded-2xl"
                >
                  {scoring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {scoring ? 'Đang chấm...' : 'Chấm AI ngay'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Score panel (only if completed) */}
        {isCompleted && submission.evaluation && (
          <div className="w-80 shrink-0 overflow-y-auto p-5 border-l border-gray-200 bg-gradient-to-b from-teal-50/30 to-emerald-50/10">
            <ScorePanel evaluation={submission.evaluation} />
          </div>
        )}
      </div>
    </div>
  );
}
