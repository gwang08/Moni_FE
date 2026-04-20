'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getMyActiveSubscription } from '@/lib/subscription-api';
import type { UserSubscriptionResponse } from '@/types/subscription.types';

/** Format endAt ISO string → "DD/MM" display. */
function formatEndDate(endAt: string): string {
  try {
    const d = new Date(endAt);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  } catch {
    return '';
  }
}

function buildLabel(sub: UserSubscriptionResponse): string {
  const aiPart =
    sub.remainAi === -1 ? 'AI không giới hạn' : `${sub.remainAi} lượt AI`;
  const expertPart = sub.remainExpert > 0 ? ` · ${sub.remainExpert} Expert` : '';
  const datePart = ` · hết ${formatEndDate(sub.endAt)}`;
  return `${sub.planName} · ${aiPart}${expertPart}${datePart}`;
}

/** Gradient pill shown in the header when user has an active subscription. */
export function ActiveSubscriptionBanner() {
  const { data: sub } = useQuery<UserSubscriptionResponse | null>({
    queryKey: ['my-active-subscription'],
    queryFn: getMyActiveSubscription,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: false,
  });

  if (!sub) return null;

  return (
    <Link
      href="/payment"
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap"
    >
      <Sparkles className="h-3 w-3 shrink-0" />
      {buildLabel(sub)}
    </Link>
  );
}
