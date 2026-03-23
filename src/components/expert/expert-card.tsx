'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Star, Award, X } from 'lucide-react';
import type { ExpertProfile } from '@/types/expert.types';

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
  const certs = expert.certificates ?? [];

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
