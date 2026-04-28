'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { UserAvatarDropdown } from '@/components/layout/user-avatar-dropdown';
import { NotificationBell } from '@/components/layout/notification-bell';
import { getDueReview } from '@/lib/vocab-api';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';

const navLinks = [
  { label: 'Luyện Tập', href: '/practice' },
  { label: 'Từ vựng', href: '/vocabulary' },
  { label: 'Lộ Trình', href: '/' },
];

function VocabNavItem() {
  const pathname = usePathname();
  const isActive = pathname === '/vocabulary' || pathname.startsWith('/vocabulary/');
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      getDueReview().then(due => setDueCount(due.length)).catch(() => { });
    };
    refresh();
    // Refetch khi: window focus, custom event từ review/flashcard, hoặc pathname đổi
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('vocab-due-changed', refresh);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('vocab-due-changed', refresh);
    };
  }, [pathname]);

  return (
    <Link
      href="/vocabulary"
      className={`relative text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${
        isActive ? 'text-primary' : 'text-gray-700'
      }`}
    >
      Từ vựng
      {dueCount > 0 && (
        <Badge className="h-4 min-w-4 px-1 text-[9px] bg-red-500 hover:bg-red-500 text-white font-bold">
          {dueCount > 99 ? '99+' : dueCount}
        </Badge>
      )}
    </Link>
  );
}

export function InnerNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const userRole = useAuthStore((state) => state.user?.role);
  
  // Filter out learner-specific links for ADMIN and EXPERT
  const filteredNavLinks = navLinks.filter((link) => {
    if (userRole === 'ADMIN' || userRole === 'EXPERT') {
      // Hide learner-specific features
      if (link.label === 'Luyện Tập' || link.label === 'Từ vựng') {
        return false;
      }
    }
    return true;
  });

  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/Moni-logo.png"
            alt="Moni"
            width={100}
            height={40}
            className="object-contain"
          />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {filteredNavLinks.map((link) => {
            if (link.label === 'Từ vựng') return <VocabNavItem key={link.label} />;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? 'text-primary' : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side: avatar + hamburger */}
        <div className="flex items-center gap-2">
          {userRole === 'USER' && (
            <Link
              href="/payment"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 border border-teal-200 hover:border-teal-400 bg-teal-50 hover:bg-teal-100 rounded-full px-3 py-1.5 transition-all"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Mua gói
            </Link>
          )}
          {userRole === 'USER' && <NotificationBell />}
          <UserAvatarDropdown />

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white pb-3">
          {filteredNavLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'text-primary bg-primary/5' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
