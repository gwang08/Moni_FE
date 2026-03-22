'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { getRoleFromToken } from '@/lib/jwt-utils';
import { Loader2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      const role = getRoleFromToken(token);
      const dest =
        role === 'ADMIN'
          ? '/admin'
          : role === 'EXPERT'
            ? '/expert/dashboard'
            : '/dashboard';
      router.replace(dest);
      return;
    }
    setChecked(true);
  }, [isAuthenticated, token, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
