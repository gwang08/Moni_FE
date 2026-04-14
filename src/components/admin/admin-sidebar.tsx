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
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
      { href: '/admin/prompts', label: 'AI Prompts', icon: BrainCircuit },
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
        // Deep slate-indigo gradient sidebar
        'bg-gradient-to-b from-[#1C1F3A] to-[#141728] shadow-2xl',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-[56px] shrink-0 items-center border-b border-white/8 px-4',
          collapsed ? 'justify-center' : 'gap-3'
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg shadow-indigo-900/40">
          <BrainCircuit className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-[14px] font-black tracking-tight text-white">Moni</span>
            <span className="text-[10px] font-semibold text-indigo-300/70 tracking-widest uppercase">Admin Panel</span>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[9.5px] font-bold uppercase tracking-widest text-white/25">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                      active
                        ? 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/30'
                        : 'text-white/50 hover:bg-white/6 hover:text-white/85',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[17px] w-[17px] shrink-0 transition-colors',
                        active ? 'text-indigo-300' : 'text-white/40 group-hover:text-white/70'
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate">{label}</span>
                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400/80" />
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile + collapse toggle */}
      <div className="shrink-0 border-t border-white/8 p-3 space-y-1">
        {/* Profile */}
        {user && (
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 bg-white/5',
              collapsed ? 'justify-center' : ''
            )}
          >
            <Avatar className="h-7 w-7 shrink-0 ring-2 ring-indigo-400/30">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || 'Admin'} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-[10px] font-black text-white">
                {getInitials(user.fullName || user.email)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/85 truncate">
                  {user.fullName || 'Admin'}
                </p>
                <p className="text-[10px] text-white/35 truncate">{user.email || 'admin'}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="shrink-0 p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={handleToggle}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] font-medium text-white/30 transition-all hover:bg-white/6 hover:text-white/60',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
