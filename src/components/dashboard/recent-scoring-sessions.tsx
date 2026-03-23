'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { getMySessions } from '@/lib/expert-api';
import type { ScoringSession } from '@/types/expert.types';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  QUEUED: { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-700' },
  IN_PROGRESS: { label: 'Đang diễn ra', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã huỷ', color: 'bg-gray-100 text-gray-600' },
};

export function RecentScoringSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ScoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    getMySessions()
      .then((data) => setSessions(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (sessions.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Phiên chấm với Giảng viên</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => router.push('/scoring-history')}
        >
          Xem tất cả <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      <div className="space-y-2">
        {sessions.map((s) => {
          const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.QUEUED;
          return (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => router.push('/scoring-history')}
            >
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <span className="font-medium">Phiên #{s.id}</span>
                  <span className="text-muted-foreground ml-2">{s.expertDisplayName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{s.skill}</Badge>
                <Badge className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
