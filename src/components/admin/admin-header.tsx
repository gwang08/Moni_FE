'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminHeaderProps {
  title: string;
}

function getInitials(name?: string | null) {
  const parts = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'AD';

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    toast.success('Đăng xuất thành công!');
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="min-w-0 text-left">
                <p className="truncate text-xs font-semibold text-gray-800">{user.fullName || 'Admin'}</p>
              </div>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || 'Admin'} />
                <AvatarFallback className="bg-red-500 text-xs font-semibold text-white">
                  {getInitials(user.fullName || user.email)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              <p className="text-sm font-medium text-gray-900">{user.fullName || 'Admin'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-500 focus:text-red-500"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
