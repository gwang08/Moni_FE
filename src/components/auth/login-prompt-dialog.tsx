'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';

interface LoginPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginPromptDialog({ open, onOpenChange }: LoginPromptDialogProps) {
  const router = useRouter();

  return (
    <>
      <ChibiAnimationStyles />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-0 rounded-3xl shadow-2xl" showCloseButton={false}>
          <VisuallyHidden><DialogTitle>Đăng nhập để tiếp tục</DialogTitle></VisuallyHidden>

          <div className="bg-gradient-to-b from-orange-50 via-orange-50/50 to-white pt-6 pb-2 px-6">
            <ChibiMascot mood="happy" size={72} />
            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-bold text-gray-800">Đăng nhập để bắt đầu!</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Bạn cần đăng nhập để làm bài luyện tập và lưu kết quả nhé!
              </p>
            </div>
          </div>

          <div className="px-6 pb-5 pt-3 space-y-2.5">
            <button
              onClick={() => router.push('/login')}
              className="w-full rounded-2xl h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => router.push('/register')}
              className="w-full rounded-2xl h-11 text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Tạo tài khoản mới
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="w-full text-xs text-gray-400 hover:text-gray-500 py-1 transition-colors"
            >
              Để sau nhé ~
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
