'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star } from 'lucide-react';
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

const SPEC_LABELS = {
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
  BOTH: 'Writing & Speaking',
} as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-300'
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

  return (
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
          {/* Status dot */}
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

      {/* Specialization */}
      <div className="flex gap-1.5 flex-wrap">
        {(expert.specialization === 'BOTH' ? ['WRITING', 'SPEAKING'] : [expert.specialization]).map((spec) => (
          <Badge key={spec} variant="secondary" className="text-xs">
            {SPEC_LABELS[spec as keyof typeof SPEC_LABELS]}
          </Badge>
        ))}
      </div>

      {/* Rating */}
      <RatingStars rating={expert.rating} />

      {/* Bio */}
      {expert.bio && (
        <p className="text-xs text-muted-foreground line-clamp-2">{expert.bio}</p>
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
  );
}
