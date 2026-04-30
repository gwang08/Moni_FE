'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth-store';

interface AdminHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const pathLabels: Record<string, string> = {
  admin: 'Dashboard',
  tests: 'Phần thi',
  'full-tests': 'Bài thi',
  tags: 'Nhãn',
  'placement-config': 'Placement Config',
  prompts: 'AI Prompts',
  'scoring-sessions': 'Chấm điểm',
  experts: 'Giám khảo',
  users: 'Người dùng',
  pricing: 'Dịch vụ',
  'user-transactions': 'Giao dịch',
  simulation: 'Simulation',
  import: 'Tạo mới',
  new: 'Tạo mới',
  media: 'Media',
  packages: 'Gói Credits',
  profile: 'Hồ sơ',
  services: 'Dịch vụ',
};

function getInitials(name?: string | null) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

export function AdminHeader({ title, description, actions }: AdminHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = pathLabels[seg] || decodeURIComponent(seg);
    return { href, label, isLast: i === segments.length - 1 };
  });

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left side: breadcrumbs + title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <nav className="flex items-center gap-1 text-xs text-gray-400">
              <Link href="/admin" className="flex items-center gap-1 transition-colors hover:text-gray-600">
                <Home className="h-3 w-3" />
              </Link>
              {breadcrumbs.slice(1).map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-gray-300" />
                  {crumb.isLast ? (
                    <span className="font-medium text-gray-500 truncate max-w-[200px]">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="transition-colors hover:text-gray-600 truncate max-w-[200px]">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-bold tracking-tight text-gray-900">{title}</h1>
              {description && (
                <>
                  <span className="text-gray-200">|</span>
                  <p className="text-xs text-gray-400">{description}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: actions + avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {actions && <div className="flex items-center gap-2">{actions}</div>}

          {user && (
            <div className="flex items-center gap-2.5 rounded-full border border-gray-100 bg-gray-50 py-1 pl-1 pr-3">
              <Avatar className="h-7 w-7 ring-2 ring-white">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || 'Admin'} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                  {getInitials(user.fullName || user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-gray-700">{user.fullName || 'Admin'}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
