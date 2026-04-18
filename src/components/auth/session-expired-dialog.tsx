'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { LogIn } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';

export function SessionExpiredDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const handler = () => {
      // Nếu user vừa chủ động bấm logout thì in-flight requests có thể 401 —
      // không show dialog vì đã có toast "Đăng xuất thành công"
      if (typeof window !== 'undefined' && window.__moniLogoutInProgress) return;
      clearAuth();
      setOpen(true);
    };
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, [clearAuth]);

  const handleLogin = () => {
    setOpen(false);
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  };

  return (
    <>
      <ChibiAnimationStyles />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-sm p-0 overflow-hidden border-0 rounded-3xl shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <VisuallyHidden><DialogTitle>Phiên đăng nhập đã hết hạn</DialogTitle></VisuallyHidden>

          <div className="bg-gradient-to-b from-blue-50 via-blue-50/50 to-white pt-6 pb-2 px-6">
            <ChibiMascot mood="sad" size={72} />
            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-bold text-gray-800">Phiên đăng nhập đã hết hạn</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Vui lòng đăng nhập lại để tiếp tục sử dụng nhé!
              </p>
            </div>
          </div>

          <div className="px-6 pb-5 pt-3">
            <button
              onClick={handleLogin}
              className="w-full rounded-2xl h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập lại
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
