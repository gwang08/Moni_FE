'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Star, Award, X, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { ExpertProfile } from '@/types/expert.types';
import type { ApiResponse } from '@/types/auth.types';

interface ExpertReview {
  id: number;
  userName: string;
  rating: number;
  comment: string;
}

interface ExpertCardProps {
  expert: ExpertProfile;
  onSelect: (expert: ExpertProfile) => void;
}

const STATUS_CONFIG = {
  AVAILABLE: { label: 'Sẵn sàng', color: 'bg-green-500' },
  BUSY: { label: 'Đang bận', color: 'bg-yellow-500' },
  OFFLINE: { label: 'Ngoại tuyến', color: 'bg-gray-400' },
} as const;

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ExpertCard({ expert, onSelect }: ExpertCardProps) {
  const status = STATUS_CONFIG[expert.status];
  const isOffline = expert.status === 'OFFLINE';
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<ExpertReview[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const certs = expert.certificates ?? [];

  const handleToggleReviews = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showReviews && !reviewsLoaded) {
      try {
        const res = await apiClient.get<ApiResponse<ExpertReview[]>>(
          `/api/v1/experts/${expert.id}/reviews`,
          true,
        );
        setReviews(res.result ?? []);
      } catch {
        setReviews([]);
      }
      setReviewsLoaded(true);
    }
    setShowReviews((v) => !v);
  };

  return (
    <>
      <Card className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
        {/* Header: avatar + name + band */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={expert.avatarUrl} alt={expert.displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(expert.displayName)}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${status.color}`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm truncate">{expert.displayName}</p>
              <Badge variant="outline" className="text-xs shrink-0">
                Band {expert.bandScore}
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${status.color}`} />
              <span className="text-xs text-muted-foreground">{status.label}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>{expert.yearsExperience} năm kinh nghiệm</p>
          <p>{expert.totalSessions} phiên chấm</p>
        </div>

        {/* Rating */}
        <RatingStars rating={expert.rating} />

        {/* Bio */}
        {expert.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2">{expert.bio}</p>
        )}

        {/* Certificates */}
        {certs.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Award className="h-3 w-3" />
              <span>Bằng cấp ({certs.length})</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {certs.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPreviewImg(url); }}
                  className="shrink-0 h-12 w-16 rounded border overflow-hidden bg-gray-100 hover:ring-2 hover:ring-primary/50 transition-all"
                >
                  <img src={url} alt={`Chứng chỉ ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div>
          <button
            type="button"
            onClick={handleToggleReviews}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showReviews ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Xem đánh giá ({expert.totalSessions})
          </button>
          {showReviews && (
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {reviews.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có đánh giá nào.</p>
              ) : (
                reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="text-xs border rounded-lg p-2 space-y-1 bg-gray-50">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-2.5 w-2.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    {r.comment && <p className="text-muted-foreground line-clamp-2">{r.comment}</p>}
                    <p className="text-xs font-medium">— {r.userName}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action */}
        <Button
          size="sm"
          className="w-full mt-auto"
          disabled={isOffline}
          onClick={() => onSelect(expert)}
          variant={isOffline ? 'outline' : 'default'}
        >
          {isOffline ? 'Không có mặt' : 'Chọn'}
        </Button>
      </Card>

      {/* Certificate preview popup */}
      <Dialog open={!!previewImg} onOpenChange={(v) => { if (!v) setPreviewImg(null); }}>
        <DialogContent className="max-w-2xl p-2 bg-black/95 border-none">
          <button
            onClick={() => setPreviewImg(null)}
            className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 rounded-full p-1.5 z-10 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          {previewImg && (
            <img src={previewImg} alt="Bằng cấp" className="w-full h-auto rounded-lg max-h-[80vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
