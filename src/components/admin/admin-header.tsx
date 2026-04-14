'use client';

import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown } from 'lucide-react';
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
    <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between border-b border-gray-100 bg-white/90 px-6 backdrop-blur-md">
      {/* Page title */}
      <h1 className="text-[15px] font-bold text-gray-800 tracking-tight">{title}</h1>

      {/* Right side */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || 'Admin'} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-[10px] font-black text-white">
                  {getInitials(user.fullName || user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[120px] truncate text-[13px]">{user.fullName || 'Admin'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-gray-100">
            <div className="px-3 py-2.5">
              <p className="text-[13px] font-semibold text-gray-900">{user.fullName || 'Admin'}</p>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.email || ''}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer gap-2 rounded-lg text-red-500 focus:text-red-500 focus:bg-red-50 mx-1 mb-1"
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
