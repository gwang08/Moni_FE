'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Award, ArrowLeft, X, Users, BookOpen, Loader2 } from 'lucide-react';
import { getExpertDetail, createScoringSession } from '@/lib/expert-api';
import { getServices } from '@/lib/payment-api';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { formatVnd } from '@/lib/utils';
import { toast } from 'sonner';
import type { ExpertProfile } from '@/types/expert.types';
import type { ApiResponse } from '@/types/auth.types';

interface Review { id: number; userName: string; rating: number; comment: string; }

function getInitials(n: string) { return n.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2); }

function Stars({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${cls} ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
      ))}
      <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = { AVAILABLE: 'Sẵn sàng', BUSY: 'Đang bận', OFFLINE: 'Ngoại tuyến' };
const STATUS_DOT: Record<string, string> = { AVAILABLE: 'bg-green-500', BUSY: 'bg-yellow-500', OFFLINE: 'bg-gray-400' };

export default function ExpertProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: expertId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const { user, refreshProfile } = useAuthStore();

  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [expertCost, setExpertCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = Number(expertId);
    Promise.all([
      getExpertDetail(id),
      apiClient.get<ApiResponse<Review[]>>(`/api/v1/experts/${id}/reviews`, true).catch(() => ({ result: [] as Review[] })),
      getServices().catch(() => []),
    ]).then(([expertData, reviewsRes, services]) => {
      setExpert(expertData);
      setReviews((reviewsRes as ApiResponse<Review[]>).result ?? []);
      const svc = (services as { serviceCode: string; creditCost: number }[]).find((s) => s.serviceCode === 'EXPERT_SPEAKING_SCORE');
      if (svc) setExpertCost(svc.creditCost);
    }).catch(() => toast.error('Không thể tải thông tin giảng viên'))
      .finally(() => setLoading(false));
  }, [expertId]);

  const handleBook = async () => {
    if (!expert || !testId) return;
    setSubmitting(true);
    try {
      const session = await createScoringSession({ expertId: expert.id, skill: 'SPEAKING', content: '', testId: Number(testId) });
      await refreshProfile();
      router.push(`/expert-scoring/queue/${session.id}`);
    } catch { toast.error('Không thể tạo phiên chấm'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="px-6 -mt-16 space-y-4"><Skeleton className="h-32 w-32 rounded-full" /><Skeleton className="h-6 w-48" /><Skeleton className="h-40 rounded-xl" /></div>
    </div>
  );

  if (!expert) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground mb-4">Không tìm thấy giảng viên.</p>
      <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
    </div>
  );

  const certs = expert.certificates ?? [];
  const balance = user?.credit ?? 0;

  return (
    <div className="max-w-4xl mx-auto pb-28">
      {/* Back button */}
      <div className="px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>
      </div>

      {/* Cover photo */}
      <div className="relative h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-b-2xl mx-4 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Avatar + Name section overlapping cover */}
      <div className="relative px-6 -mt-16">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
              <AvatarImage src={expert.avatarUrl} alt={expert.displayName} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">{getInitials(expert.displayName)}</AvatarFallback>
            </Avatar>
            <span className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-3 border-white ${STATUS_DOT[expert.status]}`} />
          </div>

          <div className="flex-1 text-center sm:text-left pb-2">
            <h1 className="text-2xl font-bold text-gray-900">{expert.displayName}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center sm:justify-start mt-0.5">
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[expert.status]}`} />
              {STATUS_LABEL[expert.status]}
              {expert.email && <span className="ml-2">· {expert.email}</span>}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-center sm:justify-start gap-6 mt-4 py-3 border-b">
          <div className="text-center">
            <p className="text-xl font-bold text-primary">{expert.bandScore}</p>
            <p className="text-xs text-muted-foreground">Band Score</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{expert.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Phiên chấm</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{expert.yearsExperience}</p>
            <p className="text-xs text-muted-foreground">Năm KN</p>
          </div>
          <div className="text-center">
            <Stars rating={expert.rating} />
            <p className="text-xs text-muted-foreground">Đánh giá</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-4">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-0">
            <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 pb-3">Thông tin</TabsTrigger>
            <TabsTrigger value="certs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 pb-3">Bằng cấp ({certs.length})</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 pb-3">Đánh giá ({reviews.length})</TabsTrigger>
          </TabsList>

          {/* Info tab */}
          <TabsContent value="info" className="mt-6 space-y-6">
            {expert.bio && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Giới thiệu</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{expert.bio}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold mb-3">Điểm IELTS chi tiết</h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Reading', value: expert.bandReading },
                  { label: 'Listening', value: expert.bandListening },
                  { label: 'Writing', value: expert.bandWriting },
                  { label: 'Speaking', value: expert.bandSpeaking },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border">
                    <p className="text-2xl font-bold text-primary">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Certificates tab */}
          <TabsContent value="certs" className="mt-6">
            {certs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có bằng cấp nào.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {certs.map((url, i) => (
                  <button key={i} type="button" onClick={() => setPreviewImg(url)}
                    className="aspect-[4/3] rounded-xl border overflow-hidden bg-gray-100 hover:ring-2 hover:ring-primary/50 hover:shadow-lg transition-all">
                    <img src={url} alt={`Chứng chỉ ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reviews tab */}
          <TabsContent value="reviews" className="mt-6">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có đánh giá nào.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="border rounded-xl p-4 space-y-2 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{r.userName}</span>
                      <Stars rating={r.rating} size="sm" />
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky book footer */}
      {testId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span>Chi phí:</span>
                <span className="text-lg font-bold text-primary">{formatVnd(expertCost)}</span>
              </div>
              <span className="text-xs text-muted-foreground">Số dư: {formatVnd(balance)}</span>
            </div>
            <Button
              size="lg"
              className="rounded-full px-8"
              disabled={submitting || expert.status === 'OFFLINE' || balance < expertCost}
              onClick={handleBook}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {expert.status === 'OFFLINE' ? 'Giảng viên ngoại tuyến' : balance < expertCost ? 'Không đủ credit' : 'Book giảng viên'}
            </Button>
          </div>
        </div>
      )}

      {/* Certificate preview */}
      <Dialog open={!!previewImg} onOpenChange={(v) => { if (!v) setPreviewImg(null); }}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-none">
          <button onClick={() => setPreviewImg(null)} className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 rounded-full p-1.5 z-10">
            <X className="h-4 w-4 text-white" />
          </button>
          {previewImg && <img src={previewImg} alt="Bằng cấp" className="w-full h-auto rounded-lg max-h-[80vh] object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
