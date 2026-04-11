'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LayoutDashboard, ClipboardList } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

const navItems = [
  { label: 'Dashboard', href: '/expert/dashboard', icon: LayoutDashboard },
  { label: 'Phiên chấm', href: '/expert/sessions', icon: ClipboardList },
];

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/practice');
      return;
    }
    if (user.role !== 'EXPERT') {
      router.push('/practice');
      return;
    }
    setIsChecking(false);
  }, [isAuthenticated, user, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSessionPage = pathname.includes('/expert/session/');

  return (
    <div className="min-h-[calc(100vh-56px)] flex">
      {/* Sidebar */}
      {!isSessionPage && (
      <aside className="w-56 bg-white border-r flex-shrink-0">
        <div className="p-4 border-b">
          <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Expert Portal
          </p>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}
