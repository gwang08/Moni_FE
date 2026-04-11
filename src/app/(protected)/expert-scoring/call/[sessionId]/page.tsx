'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DailyVideoCall } from '@/components/video/daily-video-call';
import { getQueuePosition } from '@/lib/expert-api';
import { apiClient } from '@/lib/api-client';
import { uploadMedia } from '@/lib/admin-api';
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
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const recordingBlobRef = useRef<Blob | null>(null);
  const recordingUrlRef = useRef<string | null>(null);
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
  // Track recording
  const [recordingReady, setRecordingReady] = useState(false);
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const sessionCompletedRef = useRef(false);

  // Poll session status — when COMPLETED, stop recording first, wait for blob, then show overlay
  useEffect(() => {
    if (!inCall) return;
    statusPollRef.current = setInterval(async () => {
      try {
        const data = await getQueuePosition(Number(sessionId));
        if (data.status === 'COMPLETED' && !sessionCompletedRef.current) {
          sessionCompletedRef.current = true;
          if (statusPollRef.current) clearInterval(statusPollRef.current);
          // Stop recording FIRST — blob callback needs DailyVideoCall still mounted
          if (stopRecordingRef.current) {
            stopRecordingRef.current();
            stopRecordingRef.current = null;
          }
          // Wait a bit for blob to be ready, then show overlay
          setTimeout(() => setSessionEnded(true), 1500);
        }
      } catch { /* ignore */ }
    }, 5000);
    return () => { if (statusPollRef.current) clearInterval(statusPollRef.current); };
  }, [inCall, sessionId]);

  // When recording blob ready + session completed, upload immediately
  useEffect(() => {
    if (!recordingReady || !recordingBlobRef.current || recordingUrlRef.current) return;
    const blob = recordingBlobRef.current;
    setUploadingRecording(true);
    const file = new File([blob], `recording-${sessionId}.webm`, { type: 'audio/webm' });
    uploadMedia(file)
      .then((url) => { recordingUrlRef.current = url; })
      .catch(() => { /* non-fatal */ })
      .finally(() => setUploadingRecording(false));
  }, [recordingReady, sessionId]);

  const handleLeave = () => {
    if (!inCall) return;
    if (!sessionEnded) {
      router.push('/expert-scoring');
    }
  };

  const handleRecordingReady = (blob: Blob) => {
    recordingBlobRef.current = blob;
    setRecordingReady(true);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) { toast.error('Vui lòng chọn số sao'); return; }
    if (uploadingRecording) { toast.info('Đang lưu bản ghi, vui lòng đợi...'); return; }
    setSubmittingRating(true);
    try {
      const body: Record<string, unknown> = { rating, comment: ratingComment };
      if (recordingUrlRef.current) body.recordingUrl = recordingUrlRef.current;
      await apiClient.post<ApiResponse<unknown>>(
        `/api/v1/scoring-sessions/${sessionId}/rate`,
        body,
        true,
      );
      toast.success('Cảm ơn bạn đã đánh giá!');
      router.push('/scoring-history');
    } catch {
      toast.success('Cảm ơn bạn đã đánh giá!');
      router.push('/scoring-history');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Session ended — show rating overlay
  if (sessionEnded) {
    return (
      <div className="h-[calc(100vh-56px)] bg-gradient-to-br from-orange-50/50 to-emerald-50/50 flex items-center justify-center">
        <div className="bg-white rounded-[24px] shadow-sm border border-orange-100 p-8 max-w-md w-full mx-4 space-y-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-emerald-500" />
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Phiên chấm đã kết thúc</h2>
            <p className="text-gray-500 text-[13px] mt-2">
              Giảng viên đã hoàn tất việc gửi đánh giá bài thi của bạn. Hãy chia sẻ cảm nhận về giảng viên nhé!
            </p>
          </div>

          {/* Star rating */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`h-10 w-10 transition-colors drop-shadow-sm ${
                      star <= rating
                        ? 'fill-orange-400 text-orange-400'
                        : 'text-gray-200 hover:text-orange-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="h-5">
              {rating > 0 && (
                <span className="text-[13px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full animate-in fade-in zoom-in duration-300">
                  {rating === 5 ? 'Tuyệt vời!' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Tốt' : rating === 2 ? 'Trung bình' : 'Cần cải thiện'}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <textarea
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            placeholder="Viết nhận xét ngắn về giảng viên (tuỳ chọn)..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-[13px] leading-relaxed min-h-[100px] resize-y focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-gray-400"
          />

          {uploadingRecording && (
            <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-emerald-600 bg-emerald-50 py-2 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang đồng bộ bản ghi âm lên hệ thống...</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-12 font-bold text-[14px] border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
              disabled={uploadingRecording}
              onClick={async () => {
                // Save recording URL even if user skips rating
                if (recordingUrlRef.current) {
                  try {
                    await apiClient.post<ApiResponse<unknown>>(
                      `/api/v1/scoring-sessions/${sessionId}/rate`,
                      { rating: 0, comment: '', recordingUrl: recordingUrlRef.current },
                      true,
                    );
                  } catch { /* non-fatal */ }
                }
                router.push('/scoring-history');
              }}
            >
              Bỏ qua
            </Button>
            <Button
              className="flex-1 rounded-xl h-12 font-bold text-[14px] bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm transition-colors"
              onClick={handleSubmitRating}
              disabled={submittingRating || rating === 0 || uploadingRecording}
            >
              {submittingRating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Gửi đánh giá'}
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
            enableRecording
            onRecordingReady={handleRecordingReady}
            stopRecordingRef={stopRecordingRef}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
