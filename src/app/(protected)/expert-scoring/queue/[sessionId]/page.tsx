'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cancelScoringSession, getQueuePosition } from '@/lib/expert-api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Loader2, Clock, XCircle, Mic, Headphones, Volume2, Wifi, Lightbulb, MessageCircle } from 'lucide-react';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default function QueueWaitingPage({ params }: Props) {
  const { sessionId } = use(params);
  const router = useRouter();
  const sessionIdNum = Number(sessionId);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [position, setPosition] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('QUEUED');
  const [cancelling, setCancelling] = useState(false);
  const cancellingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    if (cancellingRef.current) return; // skip khi user đang huỷ — tránh trigger toast trùng
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
    cancellingRef.current = true;
    // Dừng polling NGAY để tránh tick chạy đồng thời trigger toast 'Phiên đã kết thúc' che toast.success
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      await cancelScoringSession(sessionIdNum);
      // Refresh user profile để header cập nhật số lượt mới sau refund
      await refreshProfile();
      toast.success('Đã huỷ phiên chấm — lượt đã được hoàn lại');
      // Delay nhỏ để toast render ổn định trước khi navigate (Toaster ở root layout)
      setTimeout(() => router.push('/expert-scoring'), 250);
    } catch {
      toast.error('Không thể huỷ phiên, vui lòng thử lại');
      cancellingRef.current = false;
      setCancelling(false);
    }
  };

  const estimatedMinutes = position != null ? Math.max(1, position * 5) : null;

  const checklist = [
    { icon: Mic, label: 'Kiểm tra micro', desc: 'Đảm bảo mic hoạt động và rõ tiếng' },
    { icon: Headphones, label: 'Đeo tai nghe', desc: 'Tránh tiếng vọng và nhiễu môi trường' },
    { icon: Volume2, label: 'Nơi yên tĩnh', desc: 'Tìm góc ít tiếng ồn để tập trung nói' },
    { icon: Wifi, label: 'Mạng ổn định', desc: 'Wi-Fi hoặc 4G mạnh để call mượt' },
  ];

  const tips = [
    'Hít thở sâu, nói tự nhiên — đừng học thuộc lòng',
    'Trả lời 2–3 câu cho mỗi câu hỏi, mở rộng ý',
    'Không sao nếu mắc lỗi — quan trọng là sự lưu loát',
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 py-6 lg:py-8 lg:flex lg:items-center">
      <div className="w-full max-w-6xl mx-auto grid gap-5 lg:gap-6 lg:grid-cols-2 lg:items-start">
        {/* Status Card — col 1 */}
        <div className="rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-100/50 overflow-hidden lg:sticky lg:top-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-8 pb-7 text-center text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-purple-300/20 blur-3xl" />
            <div className="relative">
              <div className="inline-flex p-3.5 rounded-2xl bg-white/15 backdrop-blur-sm mb-3 ring-4 ring-white/10">
                <Clock className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Đang chờ giảng viên</h1>
              <p className="text-indigo-100 text-sm mt-1.5">Phiên #{sessionId} · Hệ thống sẽ tự kết nối khi đến lượt bạn</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-5">
            {position === null ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <span className="text-sm text-gray-500">Đang kiểm tra vị trí...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 px-4 py-4 text-center">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">Vị trí</div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 mt-1">#{position}</div>
                  <div className="text-[11px] font-medium text-indigo-400 mt-0.5">trong hàng chờ</div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 px-4 py-4 text-center">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Ước tính</div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 mt-1">~{estimatedMinutes ?? '—'}</div>
                  <div className="text-[11px] font-medium text-emerald-400 mt-0.5">phút chờ</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              Tự động cập nhật mỗi 3 giây
            </div>

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

        {/* Col 2 — Checklist + Tips */}
        <div className="space-y-5 lg:space-y-6">
        {/* Preparation Checklist */}
        <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Mic className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Chuẩn bị trước khi vào phiên</h2>
              <p className="text-xs text-gray-500">Tận dụng thời gian chờ để chuẩn bị tốt nhất</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {checklist.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 hover:bg-indigo-50/40 hover:border-indigo-100 transition-colors">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <Icon className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="font-bold text-gray-900">Mẹo nói tự tin</h2>
          </div>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <MessageCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
}
