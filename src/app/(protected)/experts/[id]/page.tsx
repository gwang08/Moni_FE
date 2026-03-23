'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Award, ArrowLeft, X, Users, BookOpen } from 'lucide-react';
import { getExpertDetail, createScoringSession } from '@/lib/expert-api';
import { getServices } from '@/lib/payment-api';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { ExpertProfileBookFooter } from '@/components/expert/expert-profile-book-footer';
import { toast } from 'sonner';
import type { ExpertProfile } from '@/types/expert.types';
import type { ApiResponse } from '@/types/auth.types';

interface Review {
  id: number;
  userName: string;
  rating: number;
  comment: string;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

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
const STATUS_COLOR: Record<string, string> = { AVAILABLE: 'bg-green-500', BUSY: 'bg-yellow-500', OFFLINE: 'bg-gray-400' };

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
  const [showConfirm, setShowConfirm] = useState(false);
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
      const session = await createScoringSession({
        expertId: expert.id,
        skill: 'SPEAKING',
        content: '',
        testId: Number(testId),
      });
      await refreshProfile();
      router.push(`/expert-scoring/queue/${session.id}`);
    } catch {
      toast.error('Không thể tạo phiên chấm, vui lòng thử lại');
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Không tìm thấy giảng viên.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  const certs = expert.certificates ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-32">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
      </Button>

      {/* Hero */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative shrink-0">
              <Avatar className="h-24 w-24">
                <AvatarImage src={expert.avatarUrl} alt={expert.displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{getInitials(expert.displayName)}</AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${STATUS_COLOR[expert.status]}`} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{expert.displayName}</h1>
                <Badge variant="outline">Band {expert.bandScore}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${STATUS_COLOR[expert.status]}`} />
                  {STATUS_LABEL[expert.status]}
                </span>
              </div>
              <Stars rating={expert.rating} />
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {expert.totalSessions} phiên</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {expert.yearsExperience} năm KN</span>
              </div>
              {expert.bio && <p className="text-sm text-muted-foreground">{expert.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Band scores */}
      <Card className="mb-6">
        <CardHeader className="pb-3"><CardTitle className="text-base">Điểm band</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Reading', value: expert.bandReading },
              { label: 'Listening', value: expert.bandListening },
              { label: 'Writing', value: expert.bandWriting },
              { label: 'Speaking', value: expert.bandSpeaking },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certificates */}
      {certs.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" /> Bằng cấp ({certs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {certs.map((url, i) => (
                <button key={i} type="button" onClick={() => setPreviewImg(url)}
                  className="aspect-video rounded-lg border overflow-hidden bg-gray-100 hover:ring-2 hover:ring-primary/50 transition-all">
                  <img src={url} alt={`Chứng chỉ ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      <Card className="mb-6">
        <CardHeader className="pb-3"><CardTitle className="text-base">Đánh giá ({reviews.length})</CardTitle></CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có đánh giá nào.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="border rounded-xl p-3 space-y-1.5 bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{r.userName}</span>
                    <Stars rating={r.rating} size="sm" />
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky book footer */}
      <ExpertProfileBookFooter
        expert={expert}
        testId={testId}
        expertCost={expertCost}
        balance={user?.credit ?? 0}
        showConfirm={showConfirm}
        submitting={submitting}
        onBookClick={() => setShowConfirm(true)}
        onConfirm={handleBook}
        onCancelConfirm={() => setShowConfirm(false)}
      />

      {/* Certificate preview */}
      <Dialog open={!!previewImg} onOpenChange={(v) => { if (!v) setPreviewImg(null); }}>
        <DialogContent className="max-w-2xl p-2 bg-black/95 border-none">
          <button onClick={() => setPreviewImg(null)} className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 rounded-full p-1.5 z-10 transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
          {previewImg && <img src={previewImg} alt="Bằng cấp" className="w-full h-auto rounded-lg max-h-[80vh] object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
