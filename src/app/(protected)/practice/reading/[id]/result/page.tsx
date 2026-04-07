'use client';

import { use, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock, RotateCcw, XCircle, CircleDashed } from 'lucide-react';
import { SkeletonResult } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ReadingScoreDonut } from '@/components/reading/reading-score-donut';
import { useTestDetail } from '@/hooks/use-test-detail';
import type { QuestionGroupDetail } from '@/types/test.types';
import { getReadingBand } from '@/lib/ielts-band';
import { QUESTION_TYPE_LABELS } from '@/components/practice/question-type-filter';

interface ResultData {
  attemptId?: number;
  testId: string;
  answers: Record<number, number>;
  textAnswers?: Record<number, string>;
  elapsedSeconds: number;
}

interface GroupStat {
  typeLabel: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getQuestionTypeLabel(typeCode?: string | null) {
  if (!typeCode) return 'Nhóm khác';
  return QUESTION_TYPE_LABELS[typeCode] || typeCode.replace(/_/g, ' ');
}

const GAP_TYPES = ['GAP_FILLING', 'DIAGRAM_LABEL'];

function calcGroupStats(groups: QuestionGroupDetail[], answers: Record<number, number>, textAnswers: Record<number, string> = {}): GroupStat[] {
  return groups.map((group) => {
    const isGap = GAP_TYPES.includes(group.questionTypeCode || '');
    let correct = 0, wrong = 0, skipped = 0;
    for (const q of group.questions) {
      if (isGap) {
        const userText = (textAnswers[q.id] ?? '').trim();
        if (!userText) { skipped++; continue; }
        const correctAnswer = (q.options.find(o => o.isCorrect)?.content ?? '').trim();
        const acceptedAnswers = correctAnswer.split('|').map(a => a.trim().toLowerCase());
        if (acceptedAnswers.includes(userText.toLowerCase())) correct++;
        else wrong++;
      } else {
        const selectedId = answers[q.id];
        if (selectedId == null) { skipped++; continue; }
        const selected = q.options.find(o => o.id === selectedId);
        if (selected?.isCorrect) correct++;
        else wrong++;
      }
    }
    return {
      typeLabel: getQuestionTypeLabel(group.questionTypeCode),
      total: group.questions.length,
      correct,
      wrong,
      skipped,
    };
  });
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ReadingResultPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { testDetail, loading, error } = useTestDetail(id);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const raw = sessionStorage.getItem(`practice-result-${id}`);
    if (!raw) { router.replace(`/practice/reading/${id}`); return; }
    try {
      const parsed = JSON.parse(raw) as ResultData;
      Promise.resolve().then(() => setResultData(parsed));
    } catch {
      router.replace(`/practice/reading/${id}`);
    }
  }, [id, router]);

  if (loading || !resultData) {
    return <SkeletonResult />;
  }

  if (error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice?skill=reading"><Button variant="outline">Quay lại danh sách</Button></Link>
      </div>
    );
  }

  const allGroups = testDetail.stimuli.flatMap(s => s.questionGroups);
  const groupStats = calcGroupStats(allGroups, resultData.answers, resultData.textAnswers);
  const totalQuestions = groupStats.reduce((s, g) => s + g.total, 0);
  const totalCorrect = groupStats.reduce((s, g) => s + g.correct, 0);
  const totalWrong = groupStats.reduce((s, g) => s + g.wrong, 0);
  const totalSkipped = groupStats.reduce((s, g) => s + g.skipped, 0);
  const isFullTest = testDetail.testMode === 'FULL_TEST';
  const readingBand = getReadingBand(totalCorrect, totalQuestions);
  const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50/80">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-sm text-slate-500">Kết quả làm bài</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{testDetail.title}</h1>
          <p className="text-sm text-slate-500 inline-flex items-center justify-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Thời gian: {formatTime(resultData.elapsedSeconds)}
          </p>
        </div>

        {/* Summary card */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
            <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-6 py-8 lg:border-r lg:border-slate-100">
              <ReadingScoreDonut correct={totalCorrect} wrong={totalWrong} total={totalQuestions} />
            </div>

            <div className="flex flex-col justify-between gap-6 px-6 py-6 lg:px-8">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard
                  icon={<CircleDashed className="h-4 w-4 text-slate-500" />}
                  label="Câu hỏi"
                  value={String(totalQuestions)}
                  tone="slate"
                />
                <SummaryCard
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  label="Câu đúng"
                  value={String(totalCorrect)}
                  tone="emerald"
                />
                <SummaryCard
                  icon={<XCircle className="h-4 w-4 text-rose-500" />}
                  label="Câu sai"
                  value={String(totalWrong)}
                  tone="rose"
                />
                <SummaryCard
                  icon={<RotateCcw className="h-4 w-4 text-sky-500" />}
                  label="Đã bỏ qua"
                  value={String(totalSkipped)}
                  tone="sky"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 w-full rounded-2xl bg-green-600 px-6 text-sm font-semibold shadow-sm hover:bg-green-700 sm:flex-1">
                  <Link href={`/practice/reading/${id}/review`}>
                    <ArrowRight className="h-4 w-4" />
                    Xem giải thích chi tiết
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 w-full rounded-2xl px-6 text-sm font-semibold sm:flex-1">
                  <Link href={`/practice/reading/${id}`}>
                    <RotateCcw className="h-4 w-4" />
                    Làm lại bài thi
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats table */}
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Phân tích chi tiết</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white">
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 uppercase tracking-wide text-xs">Loại câu hỏi</th>
                  <th className="text-center px-5 py-3 font-semibold text-slate-400 uppercase tracking-wide text-xs">Tổng</th>
                  <th className="text-center px-5 py-3 font-semibold text-emerald-600 uppercase tracking-wide text-xs">Đúng</th>
                  <th className="text-center px-5 py-3 font-semibold text-rose-500 uppercase tracking-wide text-xs">Sai</th>
                  <th className="text-center px-5 py-3 font-semibold text-slate-400 uppercase tracking-wide text-xs">Bỏ qua</th>
                  <th className="text-center px-5 py-3 font-semibold text-indigo-500 uppercase tracking-wide text-xs">Độ chính xác</th>
                </tr>
              </thead>
              <tbody>
                {groupStats.map((g, i) => {
                  const rowAccuracy = g.total > 0 ? (g.correct / g.total) * 100 : 0;
                  return (
                    <tr key={i} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-5 py-4 font-medium text-slate-700">{g.typeLabel}</td>
                      <td className="px-5 py-4 text-center text-slate-600">{g.total}</td>
                      <td className="px-5 py-4 text-center font-semibold text-emerald-600">{g.correct}</td>
                      <td className="px-5 py-4 text-center font-semibold text-rose-500">{g.wrong}</td>
                      <td className="px-5 py-4 text-center text-slate-500">{g.skipped}</td>
                      <td className="px-5 py-4 text-center font-semibold text-indigo-500">{rowAccuracy.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {isFullTest && (
          <div className="text-center text-sm text-slate-500">
            IELTS Band: <span className="font-semibold text-slate-900">{readingBand.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: 'slate' | 'emerald' | 'rose' | 'sky';
}) {
  const toneStyles: Record<'slate' | 'emerald' | 'rose' | 'sky', string> = {
    slate: 'bg-slate-50 border-slate-200',
    emerald: 'bg-emerald-50 border-emerald-100',
    rose: 'bg-rose-50 border-rose-100',
    sky: 'bg-sky-50 border-sky-100',
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneStyles[tone]}`}>
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        {icon}
      </div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
    </div>
  );
}
