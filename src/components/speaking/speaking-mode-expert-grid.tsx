'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import type { ExpertProfile } from '@/types/expert.types';

interface Props {
  experts: ExpertProfile[];
  expertCost: number | null;
  onBook: (expert: ExpertProfile) => void;
  onDetail: (expert: ExpertProfile) => void;
}

const STATUS_DOT: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  BUSY: 'bg-yellow-500',
  OFFLINE: 'bg-gray-400',
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3 w-3 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export function SpeakingModeExpertGrid({ experts, expertCost, onBook, onDetail }: Props) {
  if (experts.length === 0) {
    return <p className="text-muted-foreground text-center py-8 text-sm">Không có giảng viên nào phù hợp.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
      {experts.map((expert) => (
        <div key={expert.id} className="border rounded-xl p-3 flex flex-col gap-2 bg-white hover:shadow-sm transition-shadow">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={expert.avatarUrl} alt={expert.displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(expert.displayName)}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${STATUS_DOT[expert.status]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{expert.displayName}</p>
              <Badge variant="outline" className="text-xs px-1.5 py-0">Band {expert.bandScore}</Badge>
            </div>
          </div>

          <Stars rating={expert.rating} />

          {expertCost != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <img src="/currency.webp" alt="credit" className="h-3.5 w-3.5" />
              {expertCost} credit
            </span>
          )}

          {/* Actions */}
          <div className="flex gap-1.5 mt-auto">
            <Button size="sm" className="flex-1 text-xs h-7" onClick={() => onBook(expert)}>
              Book
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => onDetail(expert)}>
              Chi tiết
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
