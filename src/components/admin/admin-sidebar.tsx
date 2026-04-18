'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Tag,
  Users,
  GraduationCap,
  Package,
  Cog,
  Headphones,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCog,
  KeyRound,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Nội dung',
    items: [
      { href: '/admin/tests', label: 'Phần thi', icon: FileText },
      { href: '/admin/full-tests', label: 'Bài thi', icon: ClipboardList },
      { href: '/admin/tags', label: 'Nhãn', icon: Tag },
    ],
  },
  {
    label: 'AI & Chấm điểm',
    items: [
      { href: '/admin/prompts', label: 'AI Prompts', icon: FileText }, // Changed BrainCircuit to FileText as placeholder
      { href: '/admin/scoring-sessions', label: 'Chấm điểm', icon: Headphones },
      { href: '/admin/experts', label: 'Giám khảo', icon: GraduationCap },
    ],
  },
  {
    label: 'Người dùng & Tài chính',
    items: [
      { href: '/admin/users', label: 'Người dùng', icon: Users },
      { href: '/admin/packages', label: 'Gói nạp', icon: Package },
      { href: '/admin/services', label: 'Dịch vụ', icon: Cog },
      { href: '/admin/user-transactions', label: 'Giao dịch', icon: ReceiptText },
    ],
  },
  {
    label: 'Dev Tools',
    items: [
      { href: '/admin/simulation', label: 'Simulation', icon: FlaskConical },
    ],
  },
];

function getInitials(name?: string | null) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

interface AdminSidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export function AdminSidebar({ onCollapseChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapseChange?.(next);
  };

  const handleLogout = () => {
    toast.success('Đăng xuất thành công!');
    logout();
    router.push('/login');
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-full flex-col transition-all duration-300 ease-in-out',
        'bg-[#EDEFF2] border-r border-slate-200 shadow-sm',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Header with Logo and Collapse Button */}
      <div
        className={cn(
          'flex h-[72px] shrink-0 items-center justify-between px-4',
          collapsed && 'justify-center px-0'
        )}
      >
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 px-2">
              <img src="/Moni-logo.png" alt="Moni Logo" className="h-10 w-auto" />
            </div>
            <button
              onClick={handleToggle}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-white/60 hover:text-slate-900 transition-all shadow-sm border border-transparent hover:border-slate-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button
            onClick={handleToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/60 hover:text-slate-900 transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-all duration-200',
                      active
                        ? 'bg-white text-slate-900 font-bold shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 font-medium',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate">{label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className="shrink-0 border-t border-slate-200 p-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl px-2 py-2 transition-all cursor-pointer hover:bg-white/60',
                  collapsed ? 'justify-center' : ''
                )}
              >
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white shadow-sm">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || 'Admin'} />
                  <AvatarFallback className="bg-blue-600 text-[10px] font-bold text-white">
                    {getInitials(user.fullName || user.email)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 truncate">
                      {user.fullName || 'Admin'}
                    </p>
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={collapsed ? 'center' : 'end'}
              side={collapsed ? 'right' : 'top'}
              className="w-56 mb-2 ml-2 shadow-xl border-slate-200"
            >
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tài khoản
              </div>
              <DropdownMenuItem onClick={() => router.push('/admin/profile')} className="cursor-pointer">
                <UserCog className="mr-2 h-4 w-4 text-slate-500" />
                <span>Cài đặt tài khoản</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/profile/change-password')} className="cursor-pointer">
                <KeyRound className="mr-2 h-4 w-4 text-slate-500" />
                <span>Đổi mật khẩu</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
}
