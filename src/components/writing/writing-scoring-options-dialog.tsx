'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';

interface Props {
  open: boolean;
  aiCost: number | null;
  expertCost: number | null;
  onAIScore: () => void;
  onExpertScore: () => void;
  onSkip: () => void;
}

interface OptionCardProps {
  icon: string;
  title: string;
  description: string;
  badge: React.ReactNode;
  onClick: () => void;
  colorClass: string;
}

function OptionCard({ icon, title, description, badge, onClick, colorClass }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 border-gray-100 p-3.5 hover:border-current transition-all hover:shadow-sm ${colorClass} group`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="font-semibold text-sm text-gray-800">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
        {badge}
      </div>
    </button>
  );
}

function CreditBadge({ cost }: { cost: number }) {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 text-xs font-semibold text-amber-700 shrink-0">
      <Image src="/currency.webp" alt="credit" width={12} height={12} className="object-contain" />
      {cost.toLocaleString()}
    </span>
  );
}

export function WritingScoringOptionsDialog({ open, aiCost, expertCost, onAIScore, onExpertScore, onSkip }: Props) {
  return (
    <>
      <ChibiAnimationStyles />
      <Dialog open={open} onOpenChange={(v) => { if (!v) onSkip(); }}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-0 rounded-3xl shadow-2xl" showCloseButton={false}>
          <VisuallyHidden><DialogTitle>Chọn cách chấm điểm</DialogTitle></VisuallyHidden>

          {/* Header */}
          <div className="bg-gradient-to-b from-teal-50 via-emerald-50/50 to-white pt-6 pb-3 px-6 text-center">
            <ChibiMascot mood="happy" size={64} />
            <h2 className="text-lg font-bold text-gray-800 mt-1">Nộp bài thành công!</h2>
            <p className="text-sm text-gray-500 mt-0.5">Chọn cách chấm điểm</p>
          </div>

          {/* Options */}
          <div className="px-5 pb-5 pt-1 space-y-2.5">
            <OptionCard
              icon="🤖"
              title="Chấm AI ngay"
              description="Nhận kết quả trong 30 giây"
              badge={aiCost != null ? <CreditBadge cost={aiCost} /> : <span className="text-xs text-gray-400 shrink-0">…</span>}
              onClick={onAIScore}
              colorClass="hover:text-teal-600"
            />
            <OptionCard
              icon="👨‍🏫"
              title="Gửi Giảng viên chấm"
              description="Giảng viên chấm và gửi feedback"
              badge={expertCost != null ? <CreditBadge cost={expertCost} /> : <span className="text-xs text-gray-400 shrink-0">…</span>}
              onClick={onExpertScore}
              colorClass="hover:text-indigo-600"
            />
            <OptionCard
              icon="⏭️"
              title="Để sau"
              description="Chấm sau trong lịch sử"
              badge={<span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 shrink-0">Miễn phí</span>}
              onClick={onSkip}
              colorClass="hover:text-emerald-600"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
