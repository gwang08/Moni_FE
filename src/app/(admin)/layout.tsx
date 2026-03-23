'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SessionExpiredDialog } from '@/components/auth/session-expired-dialog';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    setIsChecking(false);
  }, [isAuthenticated, user, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="ml-64 min-h-screen">{children}</main>
      <SessionExpiredDialog />
    </div>
  );
}
