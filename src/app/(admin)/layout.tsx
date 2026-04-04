'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SessionExpiredDialog } from '@/components/auth/session-expired-dialog';

type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (cb: () => void) => () => void;
  rehydrate: () => Promise<void> | void;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const persistApi = (useAuthStore as typeof useAuthStore & { persist?: PersistApi }).persist;

  useEffect(() => {
    let unsubscribe = () => {};

    if (persistApi) {
      if (persistApi.hasHydrated()) {
        setIsHydrated(true);
      } else {
        unsubscribe = persistApi.onFinishHydration(() => {
          setIsHydrated(true);
        });

        void persistApi.rehydrate();
      }
    } else {
      setIsHydrated(true);
    }

    return () => {
      unsubscribe();
    };
  }, [persistApi]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar onCollapseChange={setSidebarCollapsed} />
      <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>{children}</main>
      <SessionExpiredDialog />
    </div>
  );
}
