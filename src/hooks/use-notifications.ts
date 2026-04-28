'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/notification-api';
import type { NotificationItem } from '@/types/notification.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface UseNotificationsReturn {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

/**
 * Subscribe to realtime notification stream via SSE + initial REST fetch.
 * Reconnects on error after 5s. Closes on unmount or auth change.
 */
export function useNotifications(): UseNotificationsReturn {
  const token = useAuthStore((s) => s.token);
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([getNotifications(), getUnreadCount()]);
      setItems(list);
      setUnread(count);
    } catch {
      // ignore network errors — keep stale state
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch {
      refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      refresh();
    }
  }, [refresh]);

  // Initial load + SSE subscribe
  useEffect(() => {
    if (!isAuth || !token) {
      setItems([]);
      setUnread(0);
      setLoading(false);
      return;
    }

    refresh();

    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      const url = `${API_BASE_URL}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener('notification', (event: MessageEvent) => {
        try {
          const incoming: NotificationItem = JSON.parse(event.data);
          setItems((prev) => {
            // Dedupe by id (in case of reconnect race)
            if (prev.some((n) => n.id === incoming.id)) return prev;
            return [incoming, ...prev].slice(0, 50);
          });
          if (!incoming.isRead) setUnread((c) => c + 1);
        } catch { /* ignore parse errors */ }
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (cancelled) return;
        // Reconnect after 5s
        reconnectTimerRef.current = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [token, isAuth, refresh]);

  return { items, unreadCount, loading, refresh, markRead, markAllRead };
}
