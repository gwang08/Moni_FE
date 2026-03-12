'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReadingScoreDonut } from '@/components/reading/reading-score-donut';
import { useTestDetail } from '@/hooks/use-test-detail';
import type { QuestionGroupDetail } from '@/types/test.types';

interface ResultData {
  attemptId?: number;
  testId: string;
  answers: Record<number, number>;
  elapsedSeconds: number;
}

interface GroupStat {
  typeCode: string;
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

function calcGroupStats(groups: QuestionGroupDetail[], answers: Record<number, number>): GroupStat[] {
  return groups.map((group) => {
    let correct = 0, wrong = 0, skipped = 0;
    for (const q of group.questions) {
      const selectedId = answers[q.id];
      if (selectedId == null) { skipped++; continue; }
      const selected = q.options.find((o) => o.id === selectedId);
      selected?.isCorrect ? correct++ : wrong++;
    }
    return {
      typeCode: group.questionTypeCode || `Nhóm ${group.id}`,
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

export default function ListeningResultPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { testDetail, loading, error } = useTestDetail(id);
  const [resultData, setResultData] = useState<ResultData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`practice-result-${id}`);
    if (!raw) { router.replace(`/practice/listening/${id}`); return; }
    try { setResultData(JSON.parse(raw)); } catch { router.replace(`/practice/listening/${id}`); }
  }, [id, router]);

  if (loading || !resultData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !testDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <p className="text-red-500">{error || 'Không tìm thấy bài tập.'}</p>
        <Link href="/practice"><Button variant="outline">Quay lại danh sách</Button></Link>
      </div>
    );
  }

  const allGroups = testDetail.stimuli.flatMap((s) => s.questionGroups);
  const groupStats = calcGroupStats(allGroups, resultData.answers);
  const totalQuestions = groupStats.reduce((s, g) => s + g.total, 0);
  const totalCorrect = groupStats.reduce((s, g) => s + g.correct, 0);
  const totalWrong = groupStats.reduce((s, g) => s + g.wrong, 0);
  const totalSkipped = groupStats.reduce((s, g) => s + g.skipped, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Kết quả làm bài</p>
        <h1 className="text-2xl font-bold">{testDetail.title}</h1>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Thời gian: {formatTime(resultData.elapsedSeconds)}
        </p>
      </div>

      {/* Score section */}
      <div className="flex flex-col sm:flex-row items-center gap-8 bg-white border rounded-xl p-6">
        <ReadingScoreDonut correct={totalCorrect} wrong={totalWrong} total={totalQuestions} />
        <div className="space-y-2 text-sm">
          <p className="flex gap-3">
            <span className="text-green-600 font-semibold">Đúng:</span>
            <span className="font-bold text-green-700">{totalCorrect} câu</span>
          </p>
          <p className="flex gap-3">
            <span className="text-red-500 font-semibold">Sai:</span>
            <span className="font-bold text-red-600">{totalWrong} câu</span>
          </p>
          <p className="flex gap-3">
            <span className="text-gray-500 font-semibold">Bỏ qua:</span>
            <span className="font-bold text-gray-600">{totalSkipped} câu</span>
          </p>
        </div>
      </div>

      {/* CTA: Review */}
      <div className="text-center">
        <Link href={`/practice/listening/${id}/review`}>
          <Button size="lg" className="bg-violet-600 hover:bg-violet-700">
            Xem giải thích chi tiết
          </Button>
        </Link>
      </div>

      {/* Stats table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold">Bảng dữ liệu chi tiết</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Loại câu hỏi</th>
              <th className="text-center px-4 py-2 font-medium text-gray-600">Số câu</th>
              <th className="text-center px-4 py-2 font-medium text-green-600">Đúng</th>
              <th className="text-center px-4 py-2 font-medium text-red-500">Sai</th>
              <th className="text-center px-4 py-2 font-medium text-gray-500">Bỏ qua</th>
            </tr>
          </thead>
          <tbody>
            {groupStats.map((g, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2">{g.typeCode}</td>
                <td className="text-center px-4 py-2">{g.total}</td>
                <td className="text-center px-4 py-2 font-semibold text-green-600">{g.correct}</td>
                <td className="text-center px-4 py-2 font-semibold text-red-500">{g.wrong}</td>
                <td className="text-center px-4 py-2 text-gray-500">{g.skipped}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Back button */}
      <div className="text-center">
        <Link href="/practice">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    </div>
  );
}
