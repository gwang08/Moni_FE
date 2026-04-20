'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import type { ServiceQuotaResponse } from '@/lib/payment-api';
import type { UserSubscriptionResponse } from '@/types/subscription.types';
import { formatVnd } from '@/lib/utils';

/** AI unlimited cap used alongside quotaAi === -1. */
const AI_UNLIMITED_CAP = 500;

interface Props {
  open: boolean;
  aiQuota: ServiceQuotaResponse | null;
  expertCost: number | null;
  balance: number;
  activeSubscription: UserSubscriptionResponse | null;
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

function VndBadge({ cost }: { cost: number }) {
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

function SubBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center text-xs text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1 shrink-0 whitespace-nowrap">
      {label}
    </span>
  );
}

/** Determine if the active subscription covers AI usage. */
function aiCoveredBySub(sub: UserSubscriptionResponse): boolean {
  if (sub.remainAi === -1) {
    // quotaAi=-1 means unlimited but capped at AI_UNLIMITED_CAP
    return sub.usedAi < AI_UNLIMITED_CAP;
  }
  return sub.remainAi > 0;
}

export function WritingScoringOptionsDialog({
  open,
  aiQuota,
  expertCost,
  balance,
  activeSubscription,
  onAIScore,
  onExpertScore,
  onSkip,
  onTopUp,
}: Props) {
  // ── AI badge + description logic ──
  let aiBadge: React.ReactNode;
  let aiDescription = 'Nhận kết quả trong 30 giây';
  let aiInsufficient = false;
  let aiHandler = onAIScore;

  if (activeSubscription && aiCoveredBySub(activeSubscription)) {
    const remaining =
      activeSubscription.remainAi === -1
        ? AI_UNLIMITED_CAP - activeSubscription.usedAi
        : activeSubscription.remainAi;
    aiBadge = <SubBadge label={`Trong gói · còn ${remaining} lượt`} />;
    aiDescription = `Dùng gói ${activeSubscription.planName}`;
  } else if (aiQuota == null) {
    aiBadge = <span className="text-xs text-gray-400 shrink-0">…</span>;
  } else {
    const aiIsFree = !aiQuota.usedToday;
    const aiCost = aiQuota.effectiveCost ?? 0;
    aiInsufficient = !aiIsFree && balance < aiCost;

    if (aiInsufficient) {
      aiBadge = <TopUpBadge />;
      aiHandler = onTopUp;
    } else if (aiIsFree) {
      aiBadge = <FreeBadge />;
    } else {
      aiBadge = <VndBadge cost={aiCost} />;
      aiDescription = `Trừ ${formatVnd(aiCost)} từ ví (còn ${formatVnd(balance)})`;
    }
  }

  // ── Expert badge + description logic ──
  let expertBadge: React.ReactNode;
  let expertDescription = 'Giảng viên chấm và gửi feedback';
  let expertInsufficient = false;
  let expertHandler = onExpertScore;

  if (activeSubscription && activeSubscription.remainExpert > 0) {
    expertBadge = <SubBadge label={`Trong gói · còn ${activeSubscription.remainExpert} lượt`} />;
    expertDescription = `Dùng gói ${activeSubscription.planName}`;
  } else if (expertCost == null) {
    expertBadge = <span className="text-xs text-gray-400 shrink-0">…</span>;
  } else {
    expertInsufficient = balance < expertCost;
    if (expertInsufficient) {
      expertBadge = <TopUpBadge />;
      expertHandler = onTopUp;
    } else {
      expertBadge = <VndBadge cost={expertCost} />;
      expertDescription = `Trừ ${formatVnd(expertCost)} từ ví (còn ${formatVnd(balance)})`;
    }
  }

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
              description={aiDescription}
              badge={aiBadge}
              onClick={aiInsufficient ? onTopUp : aiHandler}
              colorClass="hover:text-teal-600"
              insufficient={aiInsufficient}
            />
            <OptionCard
              icon="👨‍🏫"
              title="Gửi Giảng viên chấm"
              description={expertDescription}
              badge={expertBadge}
              onClick={expertInsufficient ? onTopUp : expertHandler}
              colorClass="hover:text-indigo-600"
              insufficient={expertInsufficient}
            />
            {/* "Để sau" has no cost → no badge */}
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
