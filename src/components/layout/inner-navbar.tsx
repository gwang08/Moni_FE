'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { UserAvatarDropdown } from '@/components/layout/user-avatar-dropdown';
import { getDueReview } from '@/lib/vocab-api';
import { Badge } from '@/components/ui/badge';

const navLinks = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Luyện Tập', href: '/practice' },
  { label: 'Từ vựng', href: '/vocabulary' },
  { label: 'Liên Hệ', href: '/#contact' },
];

function VocabNavItem() {
  const pathname = usePathname();
  const isActive = pathname === '/vocabulary' || pathname.startsWith('/vocabulary/');
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    getDueReview().then(due => setDueCount(due.length)).catch(() => { });
  }, []);

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

  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/Moni-logo.png"
            alt="Moni"
            width={80}
            height={32}
            className="object-contain"
          />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
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
          {navLinks.map((link) => {
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
