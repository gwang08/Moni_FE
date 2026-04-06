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

  const [historySessions, setHistorySessions] = useState<ScoringSession[]>([]);

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
        // Fetch history (all sessions including completed)
        apiClient.get<ApiResponse<ScoringSession[]>>('/api/v1/expert/sessions/history', true)
          .then(res => setHistorySessions(res.result ?? []))
          .catch(() => {});
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

  // Heartbeat: ping AVAILABLE mỗi 20s để backend biết expert còn online
  useEffect(() => {
    const ping = () => apiClient.patch('/api/v1/experts/me/status', { status: 'AVAILABLE' }, true).catch(() => {});
    const heartbeat = setInterval(ping, 20_000);

    return () => {
      clearInterval(heartbeat);
      // Khi unmount (navigate away) set offline
      apiClient.patch('/api/v1/experts/me/status', { status: 'OFFLINE' }, true).catch(() => {});
    };
  }, []);

  const handleLogout = () => {
    // Set offline before logout
    apiClient.patch('/api/v1/experts/me/status', { status: 'OFFLINE' }, true).catch(() => {});
    toast.success('Đã đăng xuất');
    logout();
    router.push('/login');
  };

  const [startingId, setStartingId] = useState<number | null>(null);

  const handleStartSession = async (id: number) => {
    if (startingId) return; // prevent double-click
    setStartingId(id);
    try {
      await apiClient.patch<ApiResponse<ScoringSession>>(
        `/api/v1/expert/sessions/${id}/start`, {}, true,
      );
      toast.success('Đã nhận phiên thành công! Đang vào phòng...');
      router.push(`/expert/session/${id}`);
    } catch {
      toast.error('Không thể bắt đầu phiên');
      setStartingId(null);
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Phiên đang chờ</h2>
          <Badge variant="secondary" className="text-xs">
            {sessions.filter(s => s.status === 'QUEUED').length} phiên
          </Badge>
        </div>
        {sessions.filter(s => s.status === 'QUEUED').length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Chưa có phiên nào đang chờ
          </Card>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Phiên</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Kỹ năng</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Thời gian tạo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Vị trí</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 text-xs uppercase tracking-wide">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sessions.filter(s => s.status === 'QUEUED').map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium">#{s.id}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.skill === 'SPEAKING' ? 'default' : 'secondary'} className="text-xs">
                        {s.skill}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {s.createdAt ? new Date(s.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                        {s.queuePosition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => handleStartSession(s.id)} disabled={startingId === s.id}>
                        {startingId === s.id ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Đang nhận...</> : 'Nhận phiên'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session History */}
      <div>
        <h2 className="font-semibold mb-3">Lịch sử phiên chấm</h2>
        {historySessions.filter(s => s.status !== 'QUEUED').length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Chưa có phiên nào đã chấm
          </Card>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Phiên</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Kỹ năng</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Đánh giá</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {historySessions.filter(s => s.status !== 'QUEUED').slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium">#{s.id}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{s.skill}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs border-0 ${s.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : s.status === 'CANCELLED' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                        {s.status === 'COMPLETED' ? 'Hoàn thành' : s.status === 'CANCELLED' ? 'Đã huỷ' : 'Đang diễn ra'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {s.userRating ? (
                        <span className="text-xs">{'⭐'.repeat(s.userRating)}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {s.createdAt ? new Date(s.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
