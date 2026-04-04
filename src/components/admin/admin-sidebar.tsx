'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cog,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Package,
  ReceiptText,
  Tag,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/tests', label: 'Phần thi', icon: FileText },
  { href: '/admin/full-tests', label: 'Bài thi', icon: ClipboardList },
  { href: '/admin/tags', label: 'Nhãn', icon: Tag },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/experts', label: 'Giám khảo', icon: GraduationCap },
  { href: '/admin/packages', label: 'Gói nạp', icon: Package },
  { href: '/admin/services', label: 'Dịch vụ', icon: Cog },
  { href: '/admin/scoring-sessions', label: 'Chấm điểm', icon: Headphones },
  { href: '/admin/user-transactions', label: 'Giao dịch', icon: ReceiptText },
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

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 flex h-full flex-col border-r border-gray-200 bg-white text-gray-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="absolute -right-3 top-4 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <nav className="space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(href) ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
