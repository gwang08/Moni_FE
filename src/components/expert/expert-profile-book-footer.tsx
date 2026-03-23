'use client';

import { Button } from '@/components/ui/button';
import type { ExpertProfile } from '@/types/expert.types';

interface BookConfirmProps {
  expertName: string;
  cost: number;
  balance: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function BookConfirm({ expertName, cost, balance, submitting, onConfirm, onCancel }: BookConfirmProps) {
  const hasEnough = balance >= cost;
  return (
    <div className="border rounded-xl p-4 bg-orange-50 space-y-3">
      <p className="font-semibold text-sm">
        Xác nhận đặt lịch với <span className="text-orange-700">{expertName}</span>
      </p>
      <div className="text-sm space-y-1 text-muted-foreground">
        <p>Chi phí: <span className="font-semibold text-foreground inline-flex items-center gap-1">{cost} <img src="/currency.webp" alt="credit" className="h-3.5 w-3.5 inline" /></span></p>
        <p>Số dư: <span className={`font-semibold inline-flex items-center gap-1 ${hasEnough ? 'text-foreground' : 'text-destructive'}`}>{balance} <img src="/currency.webp" alt="credit" className="h-3.5 w-3.5 inline" /></span></p>
        {!hasEnough && (
          <p className="text-destructive font-medium">Không đủ credit! Vui lòng <a href="/payment" className="underline">nạp thêm</a>.</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>Huỷ</Button>
        {hasEnough && (
          <Button size="sm" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang đặt...' : 'Xác nhận'}
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
  balance: number;
  showConfirm: boolean;
  submitting: boolean;
  onBookClick: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
}

/** Sticky footer with book button + inline credit confirmation for ExpertProfilePage */
export function ExpertProfileBookFooter({
  expert,
  testId,
  expertCost,
  balance,
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
            cost={expertCost}
            balance={balance}
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
                : `Book giảng viên này · ${expertCost} credit`}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
