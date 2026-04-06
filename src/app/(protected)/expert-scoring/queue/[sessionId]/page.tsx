'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cancelScoringSession, getQueuePosition } from '@/lib/expert-api';
import { toast } from 'sonner';
import { Loader2, Users } from 'lucide-react';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default function QueueWaitingPage({ params }: Props) {
  const { sessionId } = use(params);
  const router = useRouter();
  const sessionIdNum = Number(sessionId);

  const [position, setPosition] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('QUEUED');
  const [cancelling, setCancelling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    try {
      const data = await getQueuePosition(sessionIdNum);
      setPosition(data.position);
      setStatus(data.status);

      if (data.status === 'IN_PROGRESS' || data.position === 0) {
        clearInterval(intervalRef.current!);
        router.push(`/expert-scoring/call/${sessionId}`);
      }

      if (data.status === 'CANCELLED' || data.status === 'COMPLETED') {
        clearInterval(intervalRef.current!);
        toast.info('Phiên chấm đã kết thúc');
        router.push('/expert-scoring');
      }
    } catch {
      // Ignore polling errors silently
    }
  };

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelScoringSession(sessionIdNum);
      toast.success('Đã huỷ phiên chấm — credit đã được hoàn lại');
      router.back();
    } catch {
      toast.error('Không thể huỷ phiên, vui lòng thử lại');
    } finally {
      setCancelling(false);
    }
  };

  const estimatedMinutes = position != null ? Math.max(1, position * 5) : null;

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50/30 px-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-amber-100">
            <Users className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold">Đang chờ giảng viên</h1>
          <p className="text-sm text-muted-foreground">
            Phiên #{sessionId}
          </p>
        </div>

        {position === null ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Đang kiểm tra vị trí...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-3xl font-bold text-amber-700">#{position}</p>
              <p className="text-sm text-amber-600 mt-1">Vị trí trong hàng chờ</p>
            </div>

            {estimatedMinutes !== null && (
              <p className="text-sm text-muted-foreground">
                Thời gian chờ ước tính: ~{estimatedMinutes} phút
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Trạng thái: <span className="font-medium">{status}</span>
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Tự động cập nhật mỗi 3 giây...</span>
        </div>

        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang huỷ...</>
          ) : (
            'Huỷ & chọn Expert khác'
          )}
        </Button>
      </Card>
    </div>
  );
}
