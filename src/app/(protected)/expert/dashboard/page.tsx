'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { Star, Users, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import type { ExpertProfile, ScoringSession } from '@/types/expert.types';

export default function ExpertDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [sessions, setSessions] = useState<ScoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  const fetchSessions = async () => {
    try {
      const sessRes = await apiClient.get<ApiResponse<ScoringSession[]>>(
        '/api/v1/expert/sessions', true,
      );
      setSessions(sessRes.result ?? []);
    } catch { /* ignore polling errors */ }
  };

  // Auto-set online + fetch profile on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        await apiClient.patch('/api/v1/experts/me/status', { status: 'AVAILABLE' }, true);
        const res = await apiClient.get<ApiResponse<ExpertProfile>>('/api/v1/experts/me', true);
        setProfile(res.result ?? null);
        await fetchSessions();
      } catch {
        toast.error('Không thể tải thông tin');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Poll for new sessions every 5s
  useEffect(() => {
    const id = setInterval(fetchSessions, 5000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    // Set offline before logout
    apiClient.patch('/api/v1/experts/me/status', { status: 'OFFLINE' }, true).catch(() => {});
    toast.success('Đã đăng xuất');
    logout();
    router.push('/login');
  };

  const handleStartSession = async (id: number) => {
    try {
      await apiClient.patch<ApiResponse<ScoringSession>>(
        `/api/v1/expert/sessions/${id}/start`, {}, true,
      );
      router.push(`/expert/session/${id}`);
    } catch {
      toast.error('Không thể bắt đầu phiên');
    }
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
        <div>
          <h1 className="text-2xl font-bold">Xin chào, {user?.fullName ?? 'Expert'}</h1>
          <p className="text-muted-foreground text-sm mt-1">Bảng điều khiển giảng viên</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 text-red-500" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{profile?.totalSessions ?? 0}</p>
            <p className="text-xs text-muted-foreground">Tổng phiên chấm</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
          <div>
            <p className="text-2xl font-bold">{profile?.rating?.toFixed(1) ?? '0.0'}</p>
            <p className="text-xs text-muted-foreground">Đánh giá trung bình</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-green-600">Đang online</p>
            <p className="text-xs text-muted-foreground">Sẵn sàng nhận phiên</p>
          </div>
        </Card>
      </div>

      {/* Queued sessions */}
      <div>
        <h2 className="font-semibold mb-3">Phiên đang chờ</h2>
        {sessions.filter(s => s.status === 'QUEUED').length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Chưa có phiên nào đang chờ
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.filter(s => s.status === 'QUEUED').map((s) => (
              <Card key={s.id} className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-sm">Phiên #{s.id}</p>
                  <Badge variant="outline" className="text-xs">{s.skill}</Badge>
                </div>
                <Button size="sm" onClick={() => handleStartSession(s.id)}>Nhận phiên</Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
