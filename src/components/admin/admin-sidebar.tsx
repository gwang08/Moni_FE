'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface AdminSidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export function AdminSidebar({ onCollapseChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapseChange?.(next);
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-full flex-col bg-[#0f1117] text-white transition-all duration-300 ease-in-out shadow-xl',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-[56px] items-center border-b border-white/10 px-4 shrink-0',
          collapsed ? 'justify-center' : 'gap-3'
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg">
          <BrainCircuit className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-[15px] font-black tracking-tight text-white">
            Moni <span className="text-blue-400">Admin</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
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
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                        : 'text-white/55 hover:bg-white/8 hover:text-white',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        active ? 'text-white' : 'text-white/50 group-hover:text-white'
                      )}
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {!collapsed && active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          onClick={handleToggle}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] font-medium text-white/40 transition-all hover:bg-white/8 hover:text-white/70',
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
