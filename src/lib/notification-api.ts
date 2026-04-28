import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { NotificationItem } from '@/types/notification.types';

export async function getNotifications(limit = 20): Promise<NotificationItem[]> {
  const res = await apiClient.get<ApiResponse<NotificationItem[]>>(
    `/api/v1/notifications?limit=${limit}`,
    true
  );
  return res.result ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get<ApiResponse<{ count: number }>>(
    '/api/v1/notifications/unread-count',
    true
  );
  return res.result?.count ?? 0;
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(
    `/api/v1/notifications/${id}/read`,
    {},
    true
  );
}

export async function markAllNotificationsRead(): Promise<number> {
  const res = await apiClient.patch<ApiResponse<{ updated: number }>>(
    '/api/v1/notifications/read-all',
    {},
    true
  );
  return res.result?.updated ?? 0;
}
