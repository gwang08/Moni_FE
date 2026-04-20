'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { usePaymentStore } from '@/store/payment-store';
import { getMyActiveSubscription } from '@/lib/subscription-api';
import type { ExpertProfile } from '@/types/expert.types';
import type { UserSubscriptionResponse } from '@/types/subscription.types';
import { formatVnd } from '@/lib/utils';

interface Props {
  expert: ExpertProfile;
  cost: number;
  balance: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Where to redirect after top-up completes (defaults to /scoring-history) */
  returnUrl?: string;
}

export function SpeakingModeExpertInlineConfirm({ expert, cost, balance, submitting, onConfirm, onCancel, returnUrl }: Props) {
  const router = useRouter();
  const setReturnUrl = usePaymentStore((s) => s.setReturnUrl);

  // Khi user còn quota Expert (hoặc unlimited = -1) → trừ lượt thay vì trừ tiền.
  // Match logic backend CreditServiceImpl: ưu tiên subscription quota, chỉ trừ VND khi hết.
  const { data: sub } = useQuery<UserSubscriptionResponse | null>({
    queryKey: ['my-active-subscription'],
    queryFn: getMyActiveSubscription,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const willUseQuota = !!sub && (sub.remainExpert > 0 || sub.remainExpert === -1);
  const totalExpert = sub ? sub.remainExpert + sub.usedExpert : 0;

  const hasEnough = willUseQuota || balance >= cost;

  const handleTopUp = () => {
    setReturnUrl(returnUrl || '/scoring-history');
    router.push('/payment');
  };

  const isOffline = expert.status === 'OFFLINE';

  return (
    <div className="border border-orange-200 rounded-2xl p-5 bg-orange-50/80 shadow-sm space-y-4">
      <p className="font-bold text-[15px] flex items-center gap-2">
         ✨ Xác nhận đặt lịch với <span className="text-orange-700">{expert.displayName}</span>
      </p>
      {isOffline && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          ⚠️ <b>Giảng viên đang ngoại tuyến.</b> Bài của bạn sẽ vào hàng đợi và được chấm
          khi giảng viên online trở lại. Nếu không muốn đợi, bạn có thể huỷ ở
          <span className="font-semibold"> Lịch sử chấm</span> để chọn giảng viên khác (credit sẽ được hoàn lại).
        </div>
      )}
      <div className="text-sm space-y-2 text-gray-600 bg-white/60 p-4 rounded-xl border border-orange-100">
        {willUseQuota ? (
          <>
            <p className="flex justify-between items-center">
              <span className="font-medium">Chi phí:</span>
              <span className="font-bold text-indigo-700">−1 lượt Giảng viên</span>
            </p>
            <div className="h-px w-full bg-orange-100/50" />
            <p className="flex justify-between items-center">
              <span className="font-medium">Lượt còn lại (gói {sub!.planName}):</span>
              <span className="font-bold text-green-600">
                {sub!.remainExpert === -1 ? 'Không giới hạn' : `${sub!.remainExpert}/${totalExpert}`}
              </span>
            </p>
          </>
        ) : (
          <>
            <p className="flex justify-between items-center">
              <span className="font-medium">Chi phí:</span>
              <span className="font-bold text-gray-800">{formatVnd(cost)}</span>
            </p>
            <div className="h-px w-full bg-orange-100/50" />
            <p className="flex justify-between items-center">
              <span className="font-medium">Số dư hiện tại:</span>
              <span className={`font-bold ${hasEnough ? 'text-green-600' : 'text-red-500'}`}>{formatVnd(balance)}</span>
            </p>
            {!hasEnough && <p className="text-red-500 font-bold text-xs mt-2 bg-red-50 p-2 rounded-lg text-center">Không đủ số dư! Vui lòng nạp thêm.</p>}
          </>
        )}
      </div>
      <div className="flex gap-2.5 pt-1">
        <Button variant="outline" className="flex-1 rounded-xl h-10 font-bold border-orange-200 text-orange-700 hover:bg-orange-100" onClick={onCancel} disabled={submitting}>Huỷ</Button>
        {hasEnough ? (
          <Button className="flex-1 rounded-xl h-10 font-bold bg-[#16a34a] hover:bg-[#15803d] text-white shadow-sm" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang đặt...' : 'Xác nhận đặt lịch'}
          </Button>
        ) : (
          <Button className="flex-1 rounded-xl h-10 font-bold bg-[#16a34a] hover:bg-[#15803d] text-white shadow-sm" onClick={handleTopUp}>
            Nạp tiền ngay
          </Button>
        )}
      </div>
    </div>
  );
}
