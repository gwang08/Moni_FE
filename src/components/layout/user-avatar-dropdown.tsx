'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth-store';
import { User, LogOut, Shield, CreditCard, Wallet, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserAvatarDropdownProps {
  /** 'dark' = navbar on dark bg (unscrolled landing), 'light' = normal white bg */
  variant?: 'light' | 'dark';
}

export function UserAvatarDropdown({ variant = 'light' }: UserAvatarDropdownProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const isDark = variant === 'dark';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  // TODO: Replace with real credit balance from backend when available
  const creditBalance = 0;

  return (
    <div className="flex items-center gap-2">
      {/* Credit balance + Nạp button */}
      <Link
        href="/payment"
        className={`hidden sm:flex items-center gap-1.5 rounded-full pl-3 pr-1 py-1 transition-colors group ${
          isDark
            ? 'border-white/30 border bg-white/10 hover:bg-white/20'
            : 'border rounded-full hover:bg-accent'
        }`}
      >
        <Wallet className={`h-3.5 w-3.5 ${isDark ? 'text-white/70' : 'text-muted-foreground'}`} />
        <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-white' : ''}`}>
          {creditBalance.toLocaleString()}
        </span>
        <span className="flex items-center gap-0.5 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium group-hover:bg-primary/90 transition-colors">
          <Plus className="h-3 w-3" />
          Nạp
        </span>
      </Link>

      {/* Avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <Avatar className={`h-9 w-9 cursor-pointer border-2 transition-all ${
            isDark
              ? 'border-white/30 hover:border-white/60'
              : 'border-transparent hover:border-primary/30'
          }`}>
            <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || 'User'} />
            <AvatarFallback className={`text-sm font-semibold ${
              isDark
                ? 'bg-white/20 text-white'
                : 'bg-primary/10 text-primary'
            }`}>
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium truncate">{user.fullName || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>

          {/* Mobile-only credit display */}
          <div className="sm:hidden px-2 py-1.5">
            <Link
              href="/payment"
              className="flex items-center justify-between rounded-md border px-2.5 py-2 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{creditBalance.toLocaleString()}</span>
              </div>
              <span className="flex items-center gap-0.5 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">
                <Plus className="h-3 w-3" />
                Nạp
              </span>
            </Link>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Hồ sơ</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => router.push('/transactions')} className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Lịch sử giao dịch</span>
          </DropdownMenuItem>

          {user.role === 'ADMIN' && (
            <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Đăng xuất</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
