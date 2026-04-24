'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, BookMarked, PartyPopper, ArrowRight } from 'lucide-react';
import { getDueReview, getReviewStats } from '@/lib/vocab-api';
import type { ReviewStats } from '@/types/vocab.types';

// Stat cell — warm pastel tile
function StatTile({ value, label, tone }: { value: number; label: string; tone: 'slate' | 'amber' | 'emerald' | 'blue' }) {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-800',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-gray-100 text-gray-700',
  }[tone];
  return (
    <div className={`p-5 rounded-2xl text-center ${toneClass}`}>
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="text-xs font-bold mt-1 uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}

export function VocabReviewStats() {
  const [dueCount, setDueCount] = useState(0);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDueReview(), getReviewStats()])
      .then(([due, s]) => { setDueCount(due.length); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="col-span-full bg-white rounded-3xl shadow-sm p-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      </div>
    );
  }

  const mastered = stats?.masteredCount ?? 0;
  const totalSaved = stats?.totalSaved ?? 0;
  const learningCount = stats?.learningCount ?? 0;

  return (
    <div className="col-span-full bg-white rounded-3xl shadow-sm p-7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Kho từ vựng</h3>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              {dueCount > 0 ? (
                <><b className="text-amber-600">{dueCount} từ</b> đang chờ bạn ôn lại</>
              ) : (
                <>
                  <PartyPopper className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Không có từ nào cần ôn hôm nay!</span>
                </>
              )}
            </p>
          </div>
        </div>
        <Link
          href="/vocabulary/review"
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-extrabold transition-all ${
            dueCount > 0
              ? 'bg-gradient-to-r from-emerald-500 to-gray-500 text-white shadow-md shadow-emerald-500/30 hover:shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {dueCount > 0 ? `Ôn ngay (${dueCount})` : 'Xem kho từ'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile value={totalSaved} label="Tổng từ" tone="slate" />
        <StatTile value={dueCount} label="Chờ ôn" tone="amber" />
        <StatTile value={mastered} label="Thạo" tone="emerald" />
        <StatTile value={learningCount} label="Học mới" tone="blue" />
      </div>
    </div>
  );
}
