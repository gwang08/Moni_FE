'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cancelScoringSession, getQueuePosition } from '@/lib/expert-api';
import { toast } from 'sonner';
import { Loader2, Clock, XCircle } from 'lucide-react';

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
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-100/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-8 pb-6 text-center text-white">
            <div className="inline-flex p-3.5 rounded-2xl bg-white/15 backdrop-blur-sm mb-4">
              <Clock className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold">Đang chờ giảng viên</h1>
            <p className="text-indigo-100 text-sm mt-1">Phiên #{sessionId}</p>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-5">
            {position === null ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <span className="text-sm text-gray-500">Đang kiểm tra vị trí...</span>
              </div>
            ) : (
              <div className="text-center space-y-4">
                {/* Position display */}
                <div className="inline-flex flex-col items-center px-10 py-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                  <span className="text-4xl font-extrabold text-indigo-600">#{position}</span>
                  <span className="text-xs font-medium text-indigo-500 mt-1">trong hàng chờ</span>
                </div>

                {/* Meta info */}
                <div className="space-y-1">
                  {estimatedMinutes !== null && (
                    <p className="text-sm text-gray-500">
                      Chờ khoảng <span className="font-semibold text-gray-700">~{estimatedMinutes} phút</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Auto-refresh indicator */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              Tự động cập nhật
            </div>

            {/* Cancel button */}
            <Button
              variant="ghost"
              className="w-full h-11 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang huỷ...</>
              ) : (
                <><XCircle className="h-4 w-4 mr-2" />Huỷ & chọn giảng viên khác</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
