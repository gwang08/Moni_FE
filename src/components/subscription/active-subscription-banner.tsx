'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getMyActiveSubscription } from '@/lib/subscription-api';
import type { UserSubscriptionResponse } from '@/types/subscription.types';

/** Format endAt ISO → "DD/MM" */
function formatEndDate(endAt: string): string {
  try {
    const d = new Date(endAt);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

interface QuotaRowProps {
  label: string;
  remain: number;
  total: number;
  colorClass: string;
}

/**
 * 1 dòng progress bar cho 1 loại quota (AI hoặc Expert).
 * remain = -1 nghĩa unlimited → hiển thị "Không giới hạn".
 */
function QuotaRow({ label, remain, total, colorClass }: QuotaRowProps) {
  if (remain === -1) {
    return (
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-gray-600">{label}</span>
        <span className={`font-semibold ${colorClass}`}>Không giới hạn</span>
      </div>
    );
  }
  const pct = total > 0 ? Math.round((remain / total) * 100) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800 tabular-nums">
          {remain}/{total}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Row hiển thị gói + quota trong dropdown avatar. Return null nếu user chưa có sub.
 * Click → /payment để gia hạn/đổi gói.
 */
export function ActiveSubscriptionBanner() {
  const { data: sub } = useQuery<UserSubscriptionResponse | null>({
    queryKey: ['my-active-subscription'],
    queryFn: getMyActiveSubscription,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!sub) return null;

  const totalAi = sub.remainAi === -1 ? 0 : sub.remainAi + sub.usedAi;
  const totalExpert = sub.remainExpert + sub.usedExpert;

  return (
    <Link
      href="/payment"
      className="block px-2 py-1.5 group"
    >
      <div className="rounded-lg border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50/50 p-2.5 space-y-2 group-hover:border-indigo-300 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700">
            <Sparkles className="h-3 w-3" />
            {sub.planName}
          </span>
          <span className="text-[10px] text-gray-500">Hết {formatEndDate(sub.endAt)}</span>
        </div>
        <div className="space-y-1.5">
          <QuotaRow label="AI" remain={sub.remainAi} total={totalAi} colorClass="bg-indigo-500" />
          {totalExpert > 0 && (
            <QuotaRow
              label="Giảng viên"
              remain={sub.remainExpert}
              total={totalExpert}
              colorClass="bg-purple-500"
            />
          )}
        </div>
      </div>
    </Link>
  );
}
