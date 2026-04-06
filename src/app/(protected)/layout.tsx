'use client';

import { useAuthStore } from '@/store/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { InnerNavbar } from '@/components/layout/inner-navbar';
import { SessionExpiredDialog } from '@/components/auth/session-expired-dialog';

// Pages that can be viewed without authentication
const PUBLIC_PATHS = ['/practice', '/vocabulary'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Public paths always render (auth is optional)
    if (isPublicPath(pathname)) {
      checkAuth(); // still hydrate auth state if token exists
      setIsChecking(false);
      return;
    }

    const valid = checkAuth();

    if (!valid) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Redirect admin users to admin panel
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.user?.role === 'ADMIN') {
          router.push('/admin');
          return;
        }
        // Expert truy cập trang learner → redirect về expert dashboard
        if (state?.user?.role === 'EXPERT' && !pathname.startsWith('/expert')) {
          router.push('/expert/dashboard');
          return;
        }
      } catch { /* ignore */ }
    }

    setIsChecking(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkAuth, isAuthenticated, router, pathname]);

  if (isChecking || (!isAuthenticated && !isPublicPath(pathname))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isExpertRoute = pathname.startsWith('/expert');

  return (
    <div className="min-h-screen bg-gray-50">
      {!isExpertRoute && <InnerNavbar />}
      <main className="relative">{children}</main>
      {isAuthenticated && <SessionExpiredDialog />}
    </div>
  );
}
