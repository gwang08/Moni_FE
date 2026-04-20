'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import type { ExpertProfile } from '@/types/expert.types';
import { formatVnd } from '@/lib/utils';

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
      {experts.map((expert) => {
        const isOffline = expert.status === 'OFFLINE';
        return (
          <div key={expert.id} className={`border border-gray-100 rounded-[20px] p-4 flex flex-col gap-3 bg-white hover:border-orange-200 hover:shadow-md transition-all duration-300 ${isOffline ? 'opacity-60' : ''}`}>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar className="h-11 w-11 shadow-sm border border-gray-100">
                  <AvatarImage src={expert.avatarUrl} alt={expert.displayName} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-bold">
                    {getInitials(expert.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white shadow-sm ${STATUS_DOT[expert.status]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-gray-800 truncate leading-snug">{expert.displayName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[11px] px-2 py-0 bg-orange-50 text-orange-600 border-orange-200 font-semibold tracking-wide rounded-md">Band {expert.bandScore}</Badge>
                  {isOffline && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-gray-500 rounded-md">Ngoại tuyến</Badge>}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pl-1 pr-1">
              <Stars rating={expert.rating} />
              {expertCost != null && (
                <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#16a34a] bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">
                  {formatVnd(expertCost)}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
              <Button
                className="flex-1 text-[13px] h-9 font-bold rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white shadow-sm"
                onClick={() => onBook(expert)}
              >
                Book Now
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-[13px] h-9 font-bold rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => onDetail(expert)}
              >
                Chi tiết
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
