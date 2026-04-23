'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { getMyActiveSubscription } from '@/lib/subscription-api';
import type { ExpertProfile } from '@/types/expert.types';
import type { UserSubscriptionResponse } from '@/types/subscription.types';
import { AlertTriangle, CheckCircle2, Loader2, ShoppingCart } from 'lucide-react';

interface Props {
  expert: ExpertProfile;
  cost: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SpeakingModeExpertInlineConfirm({ expert, cost, submitting, onConfirm, onCancel }: Props) {
  const router = useRouter();

  const { data: sub } = useQuery<UserSubscriptionResponse | null>({
    queryKey: ['my-active-subscription'],
    queryFn: getMyActiveSubscription,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const willUseQuota = !!sub && (sub.remainExpert > 0 || sub.remainExpert === -1);
  const totalExpert = sub ? sub.remainExpert + sub.usedExpert : 0;

  const isOffline = expert.status === 'OFFLINE';

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-purple-50/40 p-5 space-y-3 shadow-sm">
      {/* Title */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
        <p className="font-bold text-sm text-gray-800">
          Xác nhận đặt lịch với <span className="text-indigo-700">{expert.displayName}</span>
        </p>
      </div>

      {/* Offline Warning */}
      {isOffline && (
        <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <b>Giảng viên đang ngoại tuyến.</b> Bài của bạn sẽ vào hàng đợi và được chấm
            khi giảng viên online trở lại.
          </div>
        </div>
      )}

      {/* Cost breakdown */}
      <div className="bg-white rounded-xl p-4 border border-indigo-100/60 space-y-2.5">
        {willUseQuota ? (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Chi phí</span>
              <span className="font-bold text-indigo-700">-1 lượt Giảng viên</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Còn lại ({sub!.planName})</span>
              <span className="font-bold text-emerald-600">
                {sub!.remainExpert === -1 ? 'Không giới hạn' : `${sub!.remainExpert}/${totalExpert}`}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-2 rounded-lg">
            <ShoppingCart className="h-3.5 w-3.5" />
            Bạn chưa có lượt chấm Giảng viên. Vui lòng mua gói.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 pt-1">
        <Button
          variant="outline"
          className="flex-1 h-10 rounded-xl font-semibold border-gray-200 text-gray-600 hover:bg-gray-50"
          onClick={onCancel}
          disabled={submitting}
        >
          Huỷ
        </Button>
        {willUseQuota ? (
          <Button
            className="flex-1 h-10 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Đang đặt...</>
            ) : (
              'Xác nhận đặt lịch'
            )}
          </Button>
        ) : (
          <Button
            className="flex-1 h-10 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            onClick={() => router.push('/payment')}
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            Mua gói ngay
          </Button>
        )}
      </div>
    </div>
  );
}
