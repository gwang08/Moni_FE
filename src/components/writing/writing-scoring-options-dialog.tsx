'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import type { ServiceQuotaResponse } from '@/lib/payment-api';
import { formatVnd } from '@/lib/utils';

interface Props {
  open: boolean;
  aiQuota: ServiceQuotaResponse | null;
  expertCost: number | null;
  balance: number;
  onAIScore: () => void;
  onExpertScore: () => void;
  onSkip: () => void;
  onTopUp: () => void;
}

interface OptionCardProps {
  icon: string;
  title: string;
  description: string;
  badge: React.ReactNode;
  onClick: () => void;
  colorClass: string;
  insufficient?: boolean;
}

function OptionCard({ icon, title, description, badge, onClick, colorClass, insufficient }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 p-3.5 transition-all group ${
        insufficient
          ? 'border-gray-100 bg-gray-50/60 hover:border-amber-300'
          : `border-gray-100 hover:border-current hover:shadow-sm ${colorClass}`
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className={`text-2xl ${insufficient ? 'opacity-50' : ''}`}>{icon}</span>
          <div>
            <p className={`font-semibold text-sm ${insufficient ? 'text-gray-500' : 'text-gray-800'}`}>{title}</p>
            <p className={`text-xs mt-0.5 ${insufficient ? 'text-amber-600' : 'text-gray-500'}`}>
              {insufficient ? 'Không đủ số dư — bấm để nạp thêm' : description}
            </p>
          </div>
        </div>
        {badge}
      </div>
    </button>
  );
}

function TopUpBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-500 text-white rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 group-hover:bg-amber-600 transition-colors">
      Nạp thêm →
    </span>
  );
}

function CreditBadge({ cost }: { cost: number }) {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 text-xs font-semibold text-amber-700 shrink-0">
      {formatVnd(cost)}
    </span>
  );
}

function FreeBadge() {
  return (
    <span className="inline-flex items-center text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 shrink-0">
      Miễn phí
    </span>
  );
}

export function WritingScoringOptionsDialog({ open, aiQuota, expertCost, balance, onAIScore, onExpertScore, onSkip, onTopUp }: Props) {
  // AI free nếu chưa dùng hôm nay → không cần check balance
  const aiIsFree = aiQuota != null && !aiQuota.usedToday;
  const aiCost = aiQuota?.effectiveCost ?? 0;
  const aiInsufficient = aiQuota != null && !aiIsFree && balance < aiCost;
  const expertInsufficient = expertCost != null && balance < expertCost;

  const aiBadge = aiQuota == null
    ? <span className="text-xs text-gray-400 shrink-0">…</span>
    : aiInsufficient
      ? <TopUpBadge />
      : aiIsFree
        ? <FreeBadge />
        : <CreditBadge cost={aiCost} />;

  const expertBadge = expertCost == null
    ? <span className="text-xs text-gray-400 shrink-0">…</span>
    : expertInsufficient
      ? <TopUpBadge />
      : <CreditBadge cost={expertCost} />;

  return (
    <>
      <ChibiAnimationStyles />
      <Dialog open={open} onOpenChange={(v) => { if (!v) onSkip(); }}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-0 rounded-3xl shadow-2xl" showCloseButton={false}>
          <VisuallyHidden><DialogTitle>Chọn cách chấm điểm</DialogTitle></VisuallyHidden>

          <div className="bg-gradient-to-b from-teal-50 via-emerald-50/50 to-white pt-6 pb-3 px-6 text-center">
            <ChibiMascot mood="happy" size={64} />
            <h2 className="text-lg font-bold text-gray-800 mt-1">Nộp bài thành công!</h2>
            <p className="text-sm text-gray-500 mt-0.5">Chọn cách chấm điểm</p>
          </div>

          <div className="px-5 pb-5 pt-1 space-y-2.5">
            <OptionCard
              icon="🤖"
              title="Chấm AI ngay"
              description="Nhận kết quả trong 30 giây"
              badge={aiBadge}
              onClick={aiInsufficient ? onTopUp : onAIScore}
              colorClass="hover:text-teal-600"
              insufficient={aiInsufficient}
            />
            <OptionCard
              icon="👨‍🏫"
              title="Gửi Giảng viên chấm"
              description="Giảng viên chấm và gửi feedback"
              badge={expertBadge}
              onClick={expertInsufficient ? onTopUp : onExpertScore}
              colorClass="hover:text-indigo-600"
              insufficient={expertInsufficient}
            />
            {/* "Để sau" không liên quan credit → không hiện badge */}
            <OptionCard
              icon="⏭️"
              title="Để sau"
              description="Chấm sau trong lịch sử"
              badge={null}
              onClick={onSkip}
              colorClass="hover:text-emerald-600"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
