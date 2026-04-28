'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  LayoutDashboard,
  ClipboardList,
  LogOut,
  UserCog,
  KeyRound,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const navItems = [
  { label: 'Dashboard', href: '/expert/dashboard', icon: LayoutDashboard },
  { label: 'Phiên chấm', href: '/expert/sessions', icon: ClipboardList },
  { label: 'Hồ sơ', href: '/expert/profile?tab=profile', icon: User },
];

function getInitials(name?: string | null) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'EX';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
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

  const handleLogout = () => {
    toast.success('Đăng xuất thành công!');
    logout();
    router.push('/login');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSessionPage = pathname.includes('/expert/session/');

  return (
    <div className="flex bg-gray-50">
      {/* Sidebar */}
      {!isSessionPage && (
        <aside className="fixed left-0 top-0 z-40 w-64 h-screen bg-[#EDEFF2] border-r border-slate-200 flex flex-col flex-shrink-0">
          {/* Header with Logo */}
          <div className="flex h-[72px] shrink-0 items-center px-6">
            <div className="flex items-center gap-3">
              <img src="/Moni-logo.png" alt="Moni Logo" className="h-10 w-auto" />
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const itemPath = item.href.split('?')[0];
              const isActive = pathname.startsWith(itemPath);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-all duration-200',
                    isActive
                      ? 'bg-white text-slate-900 font-bold shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 font-medium'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-colors',
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile section - stays at bottom */}
          <div className="shrink-0 border-t border-slate-200 p-4">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-all cursor-pointer hover:bg-white/60">
                    <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white shadow-sm">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || 'Expert'} />
                      <AvatarFallback className="bg-blue-600 text-[10px] font-bold text-white">
                        {getInitials(user.fullName || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate">
                        {user.fullName || 'Expert'}
                      </p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  className="w-56 mb-2 ml-2 shadow-xl border-slate-200"
                >
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                   Tài khoản
                  </div>
                  <DropdownMenuItem onClick={() => router.push('/expert/profile?tab=profile')} className="cursor-pointer">
                   <UserCog className="mr-2 h-4 w-4 text-slate-500" />
                   <span>Chỉnh sửa hồ sơ</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/expert/profile?tab=security')} className="cursor-pointer">
                   <KeyRound className="mr-2 h-4 w-4 text-slate-500" />
                   <span>Đổi mật khẩu</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className={cn(
        "flex-1 min-h-screen overflow-auto",
        !isSessionPage && "ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}
