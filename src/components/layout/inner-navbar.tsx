'use client';

import Image from 'next/image';
import Link from 'next/link';
import { UserAvatarDropdown } from '@/components/layout/user-avatar-dropdown';

const navLinks = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Luyện Tập', href: '/practice' },
  { label: 'Liên Hệ', href: '/#contact' },
];

export function InnerNavbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Moni"
            width={80}
            height={32}
            className="object-contain"
          />
        </Link>

        {/* Centered Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User Avatar */}
        <UserAvatarDropdown />
      </div>
    </nav>
  );
}
