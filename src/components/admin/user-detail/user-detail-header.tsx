'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldBan, Mail, Phone, Cake, Target } from 'lucide-react';
import type { UserResponse } from '@/types/admin.types';

interface Props {
  user: UserResponse;
  onBack: () => void;
  onBan: () => void;
}

function getInitials(name: string | null, email: string) {
  const source = (name || email).trim();
  return source.split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function UserDetailHeader({ user, onBack, onBan }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-500 hover:text-gray-800 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Quản lý người dùng
        </Button>
      </div>

      <div className="p-6 flex items-start gap-5">
        <Avatar className="h-20 w-20 ring-2 ring-emerald-100 ring-offset-2">
          <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? user.email} />
          <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xl font-bold">
            {getInitials(user.full_name, user.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-800 truncate">{user.full_name || 'Chưa có tên'}</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              {user.role ?? 'LEARNER'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={user.email} />
            <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="SĐT" value={user.phoneNumber ?? '—'} />
            <InfoRow icon={<Cake className="h-3.5 w-3.5" />} label="Ngày sinh" value={formatDate(user.dateOfBirth)} />
            <InfoRow icon={<Target className="h-3.5 w-3.5" />} label="Target Band" value={user.targetBand != null ? String(user.targetBand) : '—'} />
          </div>

        </div>

        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onBan}
        >
          <ShieldBan className="h-4 w-4 mr-1.5" />
          Ban
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] text-gray-400 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-sm text-gray-700 font-medium truncate">{value}</div>
    </div>
  );
}
