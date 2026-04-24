'use client';

import { useMemo } from 'react';

interface Props {
  dates: string[]; // ISO date strings of activities
  days?: number;
}

export function ActivitySparkline({ dates, days = 30 }: Props) {
  const { points, total, maxCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = new Array(days).fill(0) as number[];
    const dayMs = 86400000;

    dates.forEach((iso) => {
      if (!iso) return;
      const d = new Date(iso);
      d.setHours(0, 0, 0, 0);
      const diff = Math.floor((today.getTime() - d.getTime()) / dayMs);
      if (diff >= 0 && diff < days) {
        buckets[days - 1 - diff] += 1;
      }
    });

    const max = Math.max(1, ...buckets);
    const w = 600;
    const h = 120;
    const step = w / (days - 1);
    const pts = buckets
      .map((c, i) => `${(i * step).toFixed(1)},${(h - (c / max) * h).toFixed(1)}`)
      .join(' ');

    return {
      points: pts,
      total: buckets.reduce((a, b) => a + b, 0),
      maxCount: max,
    };
  }, [dates, days]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Hoạt động {days} ngày qua</h3>
        <span className="text-xs text-gray-500">{total} lượt · peak {maxCount}/ngày</span>
      </div>
      <svg viewBox="0 0 600 120" className="w-full h-24">
        <defs>
          <linearGradient id="act-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#act-grad)" points={`0,120 ${points} 600,120`} />
        <polyline fill="none" stroke="rgb(16 185 129)" strokeWidth="2" points={points} />
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{days} ngày trước</span>
        <span>Hôm nay</span>
      </div>
    </div>
  );
}
