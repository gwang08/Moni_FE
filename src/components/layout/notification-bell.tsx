'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Award, ClipboardCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { Badge } from '@/components/ui/badge';
import type { NotificationItem } from '@/types/notification.types';

function formatRelative(iso: string): string {
  const d = new Date(iso.includes('Z') || iso.includes('+') ? iso : iso + 'Z');
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'Vừa xong';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function NotificationIcon({ type }: { type: NotificationItem['type'] }) {
  if (type === 'EXPERT_ACCEPTED_SESSION') {
    return (
      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <ClipboardCheck className="h-4 w-4 text-blue-600" />
      </div>
    );
  }
  return (
    <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
      <Award className="h-4 w-4 text-emerald-600" />
    </div>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleItemClick = (n: NotificationItem) => {
    if (!n.isRead) markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[9px] bg-red-500 hover:bg-red-500 text-white font-bold border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Thông báo</h3>
            {items.length > 0 && unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                <CheckCheck className="h-3 w-3" /> Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Chưa có thông báo</p>
                <p className="text-xs text-gray-500 mt-1">Bạn sẽ nhận thông báo khi giảng viên nhận và chấm bài.</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                    !n.isRead ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <NotificationIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!n.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-emerald-500" />}
                    </div>
                    {n.message && (
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
