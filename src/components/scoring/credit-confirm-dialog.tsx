'use client';

import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatVnd } from '@/lib/utils';

interface CreditConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  serviceName: string;
  creditCost: number;
  currentBalance: number;
}

export function CreditConfirmDialog({
  open,
  onClose,
  onConfirm,
  serviceName,
  creditCost,
  currentBalance,
}: CreditConfirmDialogProps) {
  const hasEnough = currentBalance >= creditCost;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xác nhận sử dụng credit</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1 pt-1">
              <p>Dịch vụ: <span className="font-medium text-foreground">{serviceName}</span></p>
              <p>
                Chi phí:{' '}
                <span className="font-semibold text-foreground">
                  {formatVnd(creditCost)}
                </span>
              </p>
              <p>
                Số dư hiện tại:{' '}
                <span className={`font-semibold ${hasEnough ? 'text-foreground' : 'text-destructive'}`}>
                  {formatVnd(currentBalance)}
                </span>
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {!hasEnough && (
          <div className="flex flex-col items-center gap-3 py-4">
            {/* Sad chibi mascot */}
            <div className="text-6xl select-none">😢</div>
            <p className="text-destructive font-semibold text-center">Không đủ số dư!</p>
            <p className="text-sm text-muted-foreground text-center">
              Bạn cần thêm{' '}
              <span className="font-semibold text-foreground">{formatVnd(creditCost - currentBalance)}</span>{' '}
              để sử dụng dịch vụ này.
            </p>
            <Button asChild className="mt-1">
              <Link href="/payment">Nạp tiền ngay →</Link>
            </Button>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          {hasEnough && (
            <Button onClick={onConfirm}>
              Xác nhận
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
