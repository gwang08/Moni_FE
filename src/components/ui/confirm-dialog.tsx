'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
}

const ICON_MAP = {
  default: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    color: 'text-emerald-600',
    ring: 'ring-emerald-100',
  },
  destructive: {
    icon: AlertTriangle,
    bg: 'bg-red-50',
    color: 'text-red-500',
    ring: 'ring-red-100',
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const iconStyle = ICON_MAP[variant];
  const IconComp = iconStyle.icon;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Let caller handle errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden" showCloseButton={false}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-full ${iconStyle.bg} ring-8 ${iconStyle.ring} flex items-center justify-center mb-4`}>
              <IconComp className={`h-7 w-7 ${iconStyle.color}`} />
            </div>
            <DialogHeader className="items-center">
              <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-gray-500 mt-1.5 leading-relaxed max-w-[300px]">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          </div>
        </div>

        <div className="border-t bg-gray-50/80 px-6 py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="sm:min-w-[130px]"
            >
              {cancelText}
            </Button>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={loading}
              className="sm:min-w-[130px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
