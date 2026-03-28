'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Loader2 } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles, type ChibiMood } from '@/components/ui/chibi-mascot';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  /** Callback tùy chọn khi nhấn nút Hủy */
  onCancel?: () => void;
}

const VARIANT_CONFIG: Record<string, { mood: ChibiMood; gradient: string; btnClass: string }> = {
  default: {
    mood: 'happy',
    gradient: 'from-orange-100 via-orange-50 to-white',
    btnClass: 'bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white',
  },
  destructive: {
    mood: 'worried',
    gradient: 'from-red-50 via-rose-50 to-white',
    btnClass: 'bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white',
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
  onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.default;

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
    <>
      <ChibiAnimationStyles />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-0 rounded-3xl shadow-2xl" showCloseButton={false}>
          <VisuallyHidden><DialogTitle>{title}</DialogTitle></VisuallyHidden>

          {/* Top gradient with mascot */}
          <div className={`bg-gradient-to-b ${config.gradient} pt-6 pb-2 px-6`}>
            <ChibiMascot mood={config.mood} size={72} />
            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-bold text-gray-800">{title}</h2>
              {description && (
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="px-6 pb-5 pt-3 space-y-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`w-full rounded-2xl h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${config.btnClass}`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                confirmText
              )}
            </button>
            <button
              onClick={() => { onCancel?.(); onOpenChange(false); }}
              disabled={loading}
              className="w-full rounded-2xl h-10 text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all"
            >
              {cancelText}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
