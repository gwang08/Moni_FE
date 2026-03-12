'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, Clock } from 'lucide-react';

export function SessionExpiredDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

  const handleLogin = () => {
    setOpen(false);
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
            <Clock className="h-7 w-7 text-orange-500" />
          </div>
          <DialogTitle className="text-lg">Phiên đăng nhập đã hết hạn</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Vui lòng đăng nhập lại để tiếp tục sử dụng.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleLogin} className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full">
          <LogIn className="h-4 w-4 mr-2" />
          Đăng nhập lại
        </Button>
      </DialogContent>
    </Dialog>
  );
}
