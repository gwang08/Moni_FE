'use client';

import { Button } from '@/components/ui/button';
import type { ExpertProfile } from '@/types/expert.types';

interface Props {
  expert: ExpertProfile;
  cost: number;
  balance: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SpeakingModeExpertInlineConfirm({ expert, cost, balance, submitting, onConfirm, onCancel }: Props) {
  const hasEnough = balance >= cost;
  return (
    <div className="border rounded-xl p-4 bg-orange-50 space-y-3">
      <p className="font-semibold text-sm">
        Xác nhận đặt lịch với <span className="text-orange-700">{expert.displayName}</span>
      </p>
      <div className="text-sm space-y-1 text-muted-foreground">
        <p>Chi phí: <span className="font-semibold text-foreground inline-flex items-center gap-1">{cost} <img src="/currency.webp" alt="credit" className="h-3.5 w-3.5 inline" /></span></p>
        <p>Số dư: <span className={`font-semibold inline-flex items-center gap-1 ${hasEnough ? 'text-foreground' : 'text-destructive'}`}>{balance} <img src="/currency.webp" alt="credit" className="h-3.5 w-3.5 inline" /></span></p>
        {!hasEnough && <p className="text-destructive font-medium">Không đủ credit! Vui lòng nạp thêm.</p>}
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
