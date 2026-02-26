'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getRoleFromToken } from '@/lib/jwt-utils';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth-storage');
      if (!stored) {
        router.push('/');
        return;
      }
      const { state } = JSON.parse(stored);
      const token = state?.token;
      if (!token) {
        router.push('/');
        return;
      }
      const role = getRoleFromToken(token);
      if (role !== 'ADMIN') {
        router.push('/');
        return;
      }
      setIsChecking(false);
    } catch {
      router.push('/');
    }
  }, [router]);

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
    </div>
  );
}
