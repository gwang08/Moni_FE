'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';
import type { UserSubscriptionResponse } from '@/types/subscription.types';
import { getServiceQuota, type ServiceQuotaResponse } from '@/lib/payment-api';
import { Sparkles, GraduationCap, Clock, ChevronRight } from 'lucide-react';

/** AI unlimited cap used alongside quotaAi === -1. */
const AI_UNLIMITED_CAP = 500;

interface Props {
  open: boolean;
  activeSubscription: UserSubscriptionResponse | null;
  onAIScore: () => void;
  onExpertScore: () => void;
  onSkip: () => void;
  onBuyPackage: () => void;
}

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: React.ReactNode;
  onClick: () => void;
  iconBg: string;
  hoverBorder: string;
  disabled?: boolean;
}

function OptionCard({ icon, title, description, badge, onClick, iconBg, hoverBorder, disabled }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-2xl border-2 p-3.5 transition-all duration-200 group ${
        disabled
          ? 'border-gray-100 bg-gray-50/60 opacity-60 cursor-not-allowed'
          : `border-gray-100 bg-white ${hoverBorder} hover:shadow-md`
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${disabled ? 'opacity-50' : ''} ${iconBg}`}>
            {icon}
          </div>
          <div>
            <p className={`font-semibold text-sm ${disabled ? 'text-gray-500' : 'text-gray-800'}`}>{title}</p>
            <p className={`text-xs mt-0.5 ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {!disabled && (
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          )}
        </div>
      </div>
    </button>
  );
}

function SubBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center text-xs text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1 shrink-0 whitespace-nowrap">
      {label}
    </span>
  );
}

function NoQuotaBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-500 text-white rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 group-hover:bg-amber-600 transition-colors">
      Mua lượt →
    </span>
  );
}

/** Determine if the active subscription covers AI usage. */
function aiCoveredBySub(sub: UserSubscriptionResponse): boolean {
  if (sub.remainAi === -1) {
    return sub.usedAi < AI_UNLIMITED_CAP;
  }
  return sub.remainAi > 0;
}

export function WritingScoringOptionsDialog({
  open,
  activeSubscription,
  onAIScore,
  onExpertScore,
  onSkip,
  onBuyPackage,
}: Props) {
  const [aiQuota, setAiQuota] = useState<ServiceQuotaResponse | null>(null);

  // Fetch quota every time dialog opens — ensures accurate free turn status
  useEffect(() => {
    if (open) {
      getServiceQuota('AI_WRITING_SCORE').then(setAiQuota).catch(() => {});
    }
  }, [open]);

  // ── AI logic ──
  // Priority: free daily turn → subscription quota → buy
  const hasFreeToday = !aiQuota || !aiQuota.usedToday;
  const hasSubQuota = activeSubscription && aiCoveredBySub(activeSubscription);

  let aiBadge: React.ReactNode;
  let aiDescription = 'Nhận kết quả trong 30 giây';
  let aiHandler: () => void;

  if (hasFreeToday) {
    aiBadge = <SubBadge label="Miễn phí 1 lượt/ngày" />;
    aiDescription = hasSubQuota
      ? 'Dùng lượt miễn phí (không trừ gói)'
      : 'Lượt miễn phí hôm nay';
    aiHandler = onAIScore;
  } else if (hasSubQuota && activeSubscription) {
    const remaining =
      activeSubscription.remainAi === -1
        ? AI_UNLIMITED_CAP - activeSubscription.usedAi
        : activeSubscription.remainAi;
    aiBadge = <SubBadge label={`Trong gói · còn ${remaining} lượt`} />;
    aiDescription = `Dùng gói ${activeSubscription.planName}`;
    aiHandler = onAIScore;
  } else {
    aiBadge = <NoQuotaBadge />;
    aiDescription = 'Hết lượt miễn phí hôm nay';
    aiHandler = onBuyPackage;
  }

  // ── Expert logic ──
  let expertBadge: React.ReactNode;
  let expertDescription = 'Giảng viên chấm và gửi feedback';
  let expertHandler = onBuyPackage;

  if (activeSubscription && activeSubscription.remainExpert > 0) {
    expertBadge = <SubBadge label={`Trong gói · còn ${activeSubscription.remainExpert} lượt`} />;
    expertDescription = `Dùng gói ${activeSubscription.planName}`;
    expertHandler = onExpertScore;
  } else {
    expertBadge = <NoQuotaBadge />;
    expertDescription = 'Bạn chưa có lượt chấm Giảng viên';
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
              icon={<Sparkles className="w-5 h-5 text-teal-600" />}
              iconBg="bg-teal-50"
              hoverBorder="hover:border-teal-300"
              title="Chấm AI ngay"
              description={aiDescription}
              badge={aiBadge}
              onClick={aiHandler}
            />
            <OptionCard
              icon={<GraduationCap className="w-5 h-5 text-indigo-600" />}
              iconBg="bg-indigo-50"
              hoverBorder="hover:border-indigo-300"
              title="Gửi Giảng viên chấm"
              description={expertDescription}
              badge={expertBadge}
              onClick={expertHandler}
            />
            {/* "Để sau" */}
            <OptionCard
              icon={<Clock className="w-5 h-5 text-gray-500" />}
              iconBg="bg-gray-100"
              hoverBorder="hover:border-gray-300"
              title="Để sau"
              description="Chấm sau trong lịch sử"
              badge={null}
              onClick={onSkip}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
