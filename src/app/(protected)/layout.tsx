'use client';

import { useAuthStore } from '@/store/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { InnerNavbar } from '@/components/layout/inner-navbar';
import { SessionExpiredDialog } from '@/components/auth/session-expired-dialog';

// Pages that can be viewed without authentication
// Note: /practice and /vocabulary are intentionally kept public for browsing
// but result/review pages require authentication
const PUBLIC_PATHS = ['/practice', '/vocabulary'];

// Paths that ALWAYS require authentication (result/review pages with personal data)
const PROTECTED_SUB_PATHS = [
  '/practice/reading/',
  '/practice/listening/',
  '/practice/writing/',
  '/practice/speaking/',
  '/practice/speaking-exam/',
  '/writing/result/',
];

// Result and review pages that contain personal performance data
const RESULT_REVIEW_PATTERNS = ['/result', '/review'];

function isPublicPath(pathname: string) {
  // Check if this is a protected sub-path that requires auth
  const isProtectedSubPath = PROTECTED_SUB_PATHS.some(p => pathname.startsWith(p));
  
  // If it's under a protected sub-path AND matches result/review patterns, require auth
  if (isProtectedSubPath) {
    const isResultOrReview = RESULT_REVIEW_PATTERNS.some(pattern => pathname.includes(pattern));
    if (isResultOrReview) {
      return false; // Requires auth
    }
  }
  
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
        const role = state?.user?.role;
        
        // Define learner-only routes
        const learnerRoutes = [
          '/dashboard',
          '/practice',
          '/vocabulary',
          '/placement',
          '/speaking-exam',
          '/listening',
          '/reading',
          '/writing',
          '/scoring-history',
          '/payment',
          '/transactions',
          '/profile',
        ];
        
        const isLearnerRoute = learnerRoutes.some(route => 
          pathname === route || pathname.startsWith(route + '/')
        );
        
        if (role === 'ADMIN' && isLearnerRoute) {
          router.push('/admin');
          return;
        }
        
        if (role === 'EXPERT' && isLearnerRoute) {
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
