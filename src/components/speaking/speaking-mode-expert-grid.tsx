'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Info } from 'lucide-react';
import type { ExpertProfile } from '@/types/expert.types';

interface Props {
  experts: ExpertProfile[];
  onBook: (expert: ExpertProfile) => void;
  onDetail: (expert: ExpertProfile) => void;
}

const STATUS_META: Record<string, { dot: string; label: string }> = {
  AVAILABLE: { dot: 'bg-emerald-400', label: 'Online' },
  BUSY: { dot: 'bg-amber-400', label: 'Bận' },
  OFFLINE: { dot: 'bg-gray-300', label: 'Ngoại tuyến' },
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3 w-3 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
      <span className="text-xs text-gray-500 ml-1 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export function SpeakingModeExpertGrid({ experts, onBook, onDetail }: Props) {
  if (experts.length === 0) {
    return <p className="text-muted-foreground text-center py-8 text-sm">Không có giảng viên nào phù hợp.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
      {experts.map((expert) => {
        const isOffline = expert.status === 'OFFLINE';
        const meta = STATUS_META[expert.status] || STATUS_META.OFFLINE;

        return (
          <div
            key={expert.id}
            className={`group relative rounded-2xl border bg-white p-4 flex flex-col gap-3 transition-all duration-200 ${
              isOffline
                ? 'border-gray-100 opacity-60'
                : 'border-gray-100 hover:border-indigo-200 hover:shadow-[0_4px_20px_rgba(99,102,241,0.08)]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar className="h-11 w-11 ring-2 ring-gray-100 ring-offset-1">
                  <AvatarImage src={expert.avatarUrl} alt={expert.displayName} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 text-xs font-bold">
                    {getInitials(expert.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[2.5px] border-white ${meta.dot}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{expert.displayName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge className="text-[10px] px-1.5 py-0 h-[18px] bg-indigo-50 text-indigo-600 border-0 font-semibold rounded-md hover:bg-indigo-50">
                    Band {expert.bandScore}
                  </Badge>
                  {isOffline && (
                    <span className="text-[10px] text-gray-400 font-medium">{meta.label}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center">
              <Stars rating={expert.rating} />
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto pt-2.5 border-t border-gray-50">
              <Button
                className="flex-1 text-[13px] h-9 font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100"
                onClick={() => onBook(expert)}
              >
                Đặt lịch
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                onClick={() => onDetail(expert)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
