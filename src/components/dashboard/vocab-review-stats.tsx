'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookMarked, BookOpen, CheckCircle2, Loader2, TrendingUp, Target, Layers, Zap } from 'lucide-react';
import { getDueReview, getReviewStats, getMyLists, getMyWords } from '@/lib/vocab-api';
import type { ReviewStats, VocabCollection } from '@/types/vocab.types';

function StatBox({ icon, value, label, color, onClick }: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-xl p-4 text-center ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      } ${color}`}
    >
      <div className="flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1 opacity-70">{label}</p>
    </Wrapper>
  );
}

function ProgressBar({ value, max, label, color }: {
  value: number;
  max: number;
  label: string;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-semibold text-gray-800">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function VocabReviewStats() {
  const [dueCount, setDueCount] = useState(0);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDueReview(), getReviewStats()])
      .then(([due, s]) => {
        setDueCount(due.length);
        setStats(s);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  const mastered = stats?.masteredCount ?? 0;
  const totalSaved = stats?.totalSaved ?? 0;
  const learningCount = stats?.learningCount ?? 0;
  const listCount = stats?.listsCount ?? 0;

  return (
    <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <BookMarked className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Thống kê từ vựng</h3>
            <p className="text-xs text-gray-500">Spaced Repetition System</p>
          </div>
        </div>
        {dueCount > 0 && (
          <Link
            href="/vocabulary/review"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Zap className="h-4 w-4" />
            Ôn tập ({dueCount})
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        {/* Top row: big numbers */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatBox
            icon={<Layers className="h-6 w-6 text-indigo-600" />}
            value={totalSaved}
            label="Tổng từ đã lưu"
            color="bg-indigo-50 text-indigo-600"
          />
          <StatBox
            icon={<Zap className="h-6 w-6 text-amber-600" />}
            value={dueCount}
            label="Cần ôn hôm nay"
            color="bg-amber-50 text-amber-600"
          />
          <StatBox
            icon={<BookOpen className="h-6 w-6 text-blue-600" />}
            value={learningCount}
            label="Đang học"
            color="bg-blue-50 text-blue-600"
          />
          <StatBox
            icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
            value={mastered}
            label="Thành thạo"
            color="bg-emerald-50 text-emerald-600"
          />
          <StatBox
            icon={<Target className="h-6 w-6 text-violet-600" />}
            value={listCount}
            label="Danh sách"
            color="bg-violet-50 text-violet-600"
          />
        </div>

        {/* Progress bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Tiến độ học
            </h4>
            <ProgressBar
              value={mastered}
              max={totalSaved}
              label="Thành thạo"
              color="bg-emerald-500"
            />
            <ProgressBar
              value={learningCount}
              max={totalSaved + learningCount}
              label="Đang học"
              color="bg-blue-500"
            />
            <ProgressBar
              value={0}
              max={Math.max(dueCount, 1)}
              label="Đã ôn hôm nay"
              color="bg-amber-500"
            />
          </div>

          {/* Summary cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-500" />
              Tóm tắt
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-900">
                  {totalSaved > 0 ? Math.round((mastered / totalSaved) * 100) : 0}%
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Tỷ lệ thành thạo</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center col-span-2">
                <p className="text-sm text-gray-600">
                  {dueCount === 0
                    ? '🎉 Không có từ nào cần ôn hôm nay!'
                    : `📚 Còn ${dueCount} từ cần ôn hôm nay`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
            <Link
              href="/vocabulary/review"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold
                hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
            >
              <BookOpen className="h-4 w-4" />
              Bắt đầu ôn tập ngay
            </Link>
      </div>
    </div>
  );
}
