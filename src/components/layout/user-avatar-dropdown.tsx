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
import { User, LogOut, Shield, CreditCard, LogIn, GraduationCap, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ActiveSubscriptionBanner } from '@/components/subscription/active-subscription-banner';

interface UserAvatarDropdownProps {
  /** 'dark' = navbar on dark bg (unscrolled landing), 'light' = normal white bg */
  variant?: 'light' | 'dark';
}

export function UserAvatarDropdown({ variant = 'light' }: UserAvatarDropdownProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const isDark = variant === 'dark';

  const handleLogout = () => {
    toast.success('Đăng xuất thành công!');
    logout(); // fire & forget - don't await API call
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

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="rounded-full text-gray-700 hover:text-primary">
          <Link href="/login"><LogIn className="h-4 w-4 mr-1.5" />Đăng nhập</Link>
        </Button>
        <Button size="sm" asChild className="rounded-full hidden sm:inline-flex">
          <Link href="/register">Bắt đầu ngay</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="flex items-center gap-2">


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



          {/* Active subscription detail row — only learners, only if has active sub */}
          {user.role === 'USER' && <ActiveSubscriptionBanner />}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => router.push(user.role === 'EXPERT' ? '/expert/profile' : '/profile')} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Hồ sơ</span>
          </DropdownMenuItem>

          {user.role === 'USER' && (
            <>
              <DropdownMenuItem onClick={() => router.push('/transactions')} className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Lịch sử giao dịch</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push('/scoring-history')} className="cursor-pointer">
                <GraduationCap className="mr-2 h-4 w-4" />
                <span>Lịch sử chấm điểm</span>
              </DropdownMenuItem>
            </>
          )}

          {user.role === 'EXPERT' && (
            <DropdownMenuItem onClick={() => router.push('/expert/dashboard')} className="cursor-pointer font-medium text-blue-600 focus:text-blue-600 focus:bg-blue-50">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Expert Dashboard</span>
            </DropdownMenuItem>
          )}

          {user.role === 'ADMIN' && (
            <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer font-medium text-purple-600 focus:text-purple-600 focus:bg-purple-50">
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
