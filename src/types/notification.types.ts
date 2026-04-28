export type NotificationType = 'EXPERT_ACCEPTED_SESSION' | 'EXPERT_COMPLETED_SCORING';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  scoringSessionId: number | null;
  createdAt: string;
}
