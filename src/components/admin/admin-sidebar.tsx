'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClipboardList,
  Cog,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Tag,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tests', label: 'Phần thi', icon: FileText },
  { href: '/admin/full-tests', label: 'Bài thi', icon: ClipboardList },
  { href: '/admin/tags', label: 'Tags', icon: Tag },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/experts', label: 'Giảng viên', icon: GraduationCap },
  { href: '/admin/packages', label: 'Gói credits', icon: Package },
  { href: '/admin/services', label: 'Dịch vụ', icon: Cog },
  { href: '/admin/scoring-sessions', label: 'Công việc', icon: Headphones },
  { href: '/admin/user-transactions', label: 'Giao dịch', icon: ReceiptText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    toast.success('Đăng xuất thành công!');
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-gray-200 bg-white text-gray-800">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-1 text-xs text-gray-500">Quản trị hệ thống</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(href) ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="space-y-2 border-t border-gray-200 p-4">
        {user && (
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900">{user.fullName || 'Admin'}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
