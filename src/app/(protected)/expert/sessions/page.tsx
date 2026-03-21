'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types/auth.types';
import type { ScoringSession } from '@/types/expert.types';

export default function ExpertSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ScoringSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<ScoringSession[]>>(
        '/api/v1/expert/sessions',
        true,
      );
      setSessions(res.result ?? []);
    } catch {
      toast.error('Không thể tải danh sách phiên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleStart = async (id: number) => {
    try {
      await apiClient.patch<ApiResponse<ScoringSession>>(
        `/api/v1/expert/sessions/${id}/start`,
        {},
        true,
      );
      toast.success('Đã bắt đầu phiên');
      router.push(`/expert/session/${id}`);
    } catch {
      toast.error('Không thể bắt đầu phiên');
    }
  };

  const statusLabel: Record<string, string> = {
    QUEUED: 'Đang chờ',
    IN_PROGRESS: 'Đang diễn ra',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã huỷ',
  };

  const statusColor: Record<string, string> = {
    QUEUED: 'bg-yellow-100 text-yellow-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Phiên chấm điểm</h1>
        <Button variant="outline" size="sm" onClick={fetchSessions}>
          Làm mới
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">
          Chưa có phiên chấm nào
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">Phiên #{s.id}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{s.skill}</Badge>
                  <Badge className={`text-xs ${statusColor[s.status] || ''}`}>
                    {statusLabel[s.status] || s.status}
                  </Badge>
                </div>
              </div>
              {s.status === 'QUEUED' && (
                <Button size="sm" onClick={() => handleStart(s.id)}>
                  Nhận phiên
                </Button>
              )}
              {s.status === 'IN_PROGRESS' && (
                <Button size="sm" onClick={() => router.push(`/expert/session/${s.id}`)}>
                  Tiếp tục
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
