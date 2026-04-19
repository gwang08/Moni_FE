'use client';

import type { ReactNode } from 'react';
import { User, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export type ProfileTabKey = 'profile' | 'security';

interface NavItem {
  key: ProfileTabKey;
  label: string;
  icon: ReactNode;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'profile',
    label: 'Thông tin cá nhân',
    icon: <User className="h-4 w-4" />,
    description: 'Họ tên, email, ngày sinh',
  },
  {
    key: 'security',
    label: 'Bảo mật',
    icon: <Shield className="h-4 w-4" />,
    description: 'Mật khẩu đăng nhập',
  },
];

interface Props {
  active: ProfileTabKey;
  onChange: (k: ProfileTabKey) => void;
}

// Sidebar trái của trang profile — avatar chip + vertical nav (Stripe-style)
export function ProfileSidebar({ active, onChange }: Props) {
  const user = useAuthStore((s) => s.user);
  const initials = getInitials(user?.fullName ?? 'U');

  return (
    <aside className="border-b lg:border-b-0 lg:border-r border-slate-100 p-5 lg:p-6 bg-slate-50/50">
      {/* User chip */}
      <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-200">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 text-white font-black grid place-items-center shadow-sm shrink-0 text-[15px]">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.fullName ?? 'avatar'} className="h-full w-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-extrabold truncate">{user?.fullName ?? 'Học viên'}</div>
          <div className="text-[11.5px] text-slate-500 font-semibold truncate">{user?.email ?? '—'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-white border border-slate-200 shadow-sm'
                  : 'hover:bg-white/60 border border-transparent'
              }`}
            >
              <span className={`mt-0.5 ${isActive ? 'text-teal-600' : 'text-slate-500'}`}>{item.icon}</span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[13px] font-bold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                  {item.label}
                </span>
                <span className="block text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
