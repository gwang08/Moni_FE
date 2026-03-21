'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { Star, Users, ToggleLeft } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';

interface QueuedSession {
  id: number;
  studentName: string;
  skill: string;
  createdAt: string;
}

// Mock stats – replace with API call when backend ready
const mockStats = { totalSessions: 42, rating: 4.7 };

export default function ExpertDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [sessions, setSessions] = useState<QueuedSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const toggleStatus = async (online: boolean) => {
    try {
      await apiClient.patch<ApiResponse<unknown>>(
        '/api/v1/experts/me/status',
        { status: online ? 'AVAILABLE' : 'OFFLINE' },
        true
      );
      setIsOnline(online);
      if (online) {
        fetchQueuedSessions();
      }
      toast.success(online ? 'Bạn đang online' : 'Bạn đã offline');
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const fetchQueuedSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await apiClient.get<ApiResponse<QueuedSession[]>>(
        '/api/v1/experts/me/queued-sessions',
        true
      );
      setSessions(response.result ?? []);
    } catch {
      toast.error('Không thể tải danh sách phiên');
    } finally {
      setLoadingSessions(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Xin chào, {user?.fullName ?? 'Expert'}</h1>
        <p className="text-muted-foreground text-sm mt-1">Bảng điều khiển giảng viên</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{mockStats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Tổng phiên chấm</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
          <div>
            <p className="text-2xl font-bold">{mockStats.rating}</p>
            <p className="text-xs text-muted-foreground">Đánh giá trung bình</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <ToggleLeft className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-sm font-semibold">{isOnline ? 'Đang online' : 'Offline'}</p>
            <p className="text-xs text-muted-foreground">Trạng thái hiện tại</p>
          </div>
        </Card>
      </div>

      {/* Online toggle */}
      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">Nhận phiên chấm</p>
          <p className="text-xs text-muted-foreground">
            Bật để học viên có thể đặt lịch với bạn
          </p>
        </div>
        <Button
          size="sm"
          variant={isOnline ? 'destructive' : 'default'}
          onClick={() => toggleStatus(!isOnline)}
        >
          {isOnline ? 'Chuyển Offline' : 'Bật Online'}
        </Button>
      </Card>

      {/* Queued sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Phiên đang chờ</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQueuedSessions}
            disabled={loadingSessions}
          >
            Làm mới
          </Button>
        </div>

        {sessions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            {isOnline ? 'Chưa có phiên nào đang chờ' : 'Bật online để nhận phiên mới'}
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card key={session.id} className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{session.studentName}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{session.skill}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push(`/expert/session/${session.id}`)}
                >
                  Nhận phiên
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
