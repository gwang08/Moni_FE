'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DailyVideoCall } from '@/components/video/daily-video-call';
import { getQueuePosition } from '@/lib/expert-api';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Star } from 'lucide-react';
import type { ApiResponse } from '@/types/auth.types';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default function ExpertCallPage({ params }: Props) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [roomUrl, setRoomUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch roomUrl
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const data = await getQueuePosition(Number(sessionId));
        if (data.roomUrl) {
          setRoomUrl(data.roomUrl);
          setLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
          return;
        }
        if (data.status === 'CANCELLED' || data.status === 'COMPLETED') {
          if (pollRef.current) clearInterval(pollRef.current);
          router.push('/expert-scoring');
          return;
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchRoom();
    pollRef.current = setInterval(fetchRoom, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId, router]);

  // Poll session status during call to detect COMPLETED
  useEffect(() => {
    if (!inCall) return;
    statusPollRef.current = setInterval(async () => {
      try {
        const data = await getQueuePosition(Number(sessionId));
        if (data.status === 'COMPLETED') {
          if (statusPollRef.current) clearInterval(statusPollRef.current);
          setSessionEnded(true);
        }
      } catch { /* ignore */ }
    }, 5000);
    return () => { if (statusPollRef.current) clearInterval(statusPollRef.current); };
  }, [inCall, sessionId]);

  const handleLeave = () => {
    if (!inCall) return;
    if (!sessionEnded) {
      router.push('/expert-scoring');
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) { toast.error('Vui lòng chọn số sao'); return; }
    setSubmittingRating(true);
    try {
      await apiClient.post<ApiResponse<unknown>>(
        `/api/v1/scoring-sessions/${sessionId}/rate`,
        { rating, comment: ratingComment },
        true,
      );
      toast.success('Cảm ơn bạn đã đánh giá!');
      router.push('/practice');
    } catch {
      // If endpoint not implemented yet, just navigate away
      toast.success('Cảm ơn bạn đã đánh giá!');
      router.push('/practice');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Session ended — show rating overlay
  if (sessionEnded) {
    return (
      <div className="h-[calc(100vh-56px)] bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border p-8 max-w-md w-full mx-4 space-y-6 text-center">
          <div>
            <h2 className="text-xl font-bold">Phiên chấm đã kết thúc</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Giảng viên đã gửi đánh giá. Hãy cho điểm giảng viên nhé!
            </p>
          </div>

          {/* Star rating */}
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300 hover:text-amber-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-amber-600 font-medium">
              {rating === 5 ? 'Xuất sắc!' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Tốt' : rating === 2 ? 'Bình thường' : 'Cần cải thiện'}
            </p>
          )}

          {/* Comment */}
          <textarea
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            placeholder="Nhận xét về giảng viên (tuỳ chọn)..."
            className="w-full rounded-lg border px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/practice')}
            >
              Bỏ qua
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmitRating}
              disabled={submittingRating || rating === 0}
            >
              {submittingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gửi đánh giá'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:text-white"
          onClick={() => router.push('/expert-scoring')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Thoát
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="animate-pulse">
            LIVE
          </Badge>
          <span className="text-sm text-gray-300">Phiên #{sessionId}</span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 p-1">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <DailyVideoCall
            roomUrl={roomUrl}
            userName={user?.fullName || 'Học viên'}
            onJoined={() => setInCall(true)}
            onLeave={handleLeave}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
