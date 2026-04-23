'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { getMyActiveSubscription } from '@/lib/subscription-api';
import type { ExpertProfile } from '@/types/expert.types';
import type { UserSubscriptionResponse } from '@/types/subscription.types';
import { ShoppingCart } from 'lucide-react';

interface BookConfirmProps {
  expertName: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function BookConfirm({ expertName, submitting, onConfirm, onCancel }: BookConfirmProps) {
  const router = useRouter();
  const { data: sub } = useQuery<UserSubscriptionResponse | null>({
    queryKey: ['my-active-subscription'],
    queryFn: getMyActiveSubscription,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const hasQuota = !!sub && (sub.remainExpert > 0 || sub.remainExpert === -1);

  return (
    <div className="border rounded-xl p-4 bg-orange-50 space-y-3">
      <p className="font-semibold text-sm">
        Xác nhận đặt lịch với <span className="text-orange-700">{expertName}</span>
      </p>
      {hasQuota ? (
        <div className="text-sm space-y-1 text-muted-foreground">
          <p>Chi phí: <span className="font-semibold text-indigo-700">-1 lượt Giảng viên</span></p>
          <p>Còn lại ({sub!.planName}): <span className="font-semibold text-emerald-600">
            {sub!.remainExpert === -1 ? 'Không giới hạn' : sub!.remainExpert}
          </span></p>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-2 rounded-lg">
          <ShoppingCart className="h-3.5 w-3.5" />
          Bạn chưa có lượt chấm Giảng viên. Vui lòng mua gói.
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>Huỷ</Button>
        {hasQuota ? (
          <Button size="sm" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang đặt...' : 'Xác nhận'}
          </Button>
        ) : (
          <Button size="sm" onClick={() => router.push('/payment')}>
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            Mua gói ngay
          </Button>
        )}
      </div>
    </div>
  );
}

interface Props {
  expert: ExpertProfile;
  testId: string | null;
  expertCost: number;
  showConfirm: boolean;
  submitting: boolean;
  onBookClick: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
}

/** Sticky footer with book button + inline confirmation for ExpertProfilePage */
export function ExpertProfileBookFooter({
  expert,
  testId,
  expertCost,
  showConfirm,
  submitting,
  onBookClick,
  onConfirm,
  onCancelConfirm,
}: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-30">
      <div className="max-w-3xl mx-auto space-y-3">
        {showConfirm && testId && (
          <BookConfirm
            expertName={expert.displayName}
            submitting={submitting}
            onConfirm={onConfirm}
            onCancel={onCancelConfirm}
          />
        )}
        {!testId ? (
          <p className="text-sm text-muted-foreground text-center">
            Chọn bài speaking trước khi book giảng viên.
          </p>
        ) : (
          !showConfirm && (
            <Button
              className="w-full"
              size="lg"
              onClick={onBookClick}
              disabled={expert.status === 'OFFLINE'}
            >
              {expert.status === 'OFFLINE'
                ? 'Giảng viên không có mặt'
                : 'Book giảng viên này'}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
