'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Zap, Receipt, Crown, Star, CheckCircle2, BadgeCheck } from 'lucide-react';
import { getPackages, getServices } from '@/lib/payment-api';
import { listPlans, getMyActiveSubscription } from '@/lib/subscription-api';
import { usePaymentStore } from '@/store/payment-store';
import { Button } from '@/components/ui/button';
import { formatVnd } from '@/lib/utils';
import { SkeletonCard, SkeletonLine } from '@/components/ui/skeleton';
import type { PackagePricingResponse } from '@/types/payment.types';
import type { SubscriptionPlanResponse, UserSubscriptionResponse } from '@/types/subscription.types';

const formatVND = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + ' đ';

const TIER_STYLES = [
  {
    gradient: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200 hover:border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: <Star className="h-5 w-5 text-emerald-500" />,
    btn: 'bg-emerald-500 hover:bg-emerald-600',
  },
  {
    gradient: 'from-violet-50 to-purple-50',
    border: 'border-violet-200 hover:border-violet-400',
    badge: 'bg-violet-100 text-violet-700',
    icon: <Crown className="h-5 w-5 text-violet-500" />,
    btn: 'bg-violet-500 hover:bg-violet-600',
  },
  {
    gradient: 'from-amber-50 to-orange-50',
    border: 'border-amber-200 hover:border-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    icon: <Sparkles className="h-5 w-5 text-amber-500" />,
    btn: 'bg-amber-500 hover:bg-amber-600',
  },
];

/** Subscription plan highlight styles (index 1 = "popular") */
const SUB_STYLES = [
  {
    gradient: 'from-sky-50 to-blue-50',
    border: 'border-sky-200 hover:border-sky-400',
    btn: 'bg-sky-500 hover:bg-sky-600',
  },
  {
    gradient: 'from-indigo-50 to-purple-50',
    border: 'border-indigo-400',
    btn: 'bg-indigo-600 hover:bg-indigo-700',
    popular: true,
  },
  {
    gradient: 'from-violet-50 to-fuchsia-50',
    border: 'border-violet-200 hover:border-violet-400',
    btn: 'bg-violet-500 hover:bg-violet-600',
  },
];

function PackageSkeleton() {
  return (
    <SkeletonCard className="p-6 space-y-4">
      <SkeletonLine className="w-3/4 h-5" />
      <SkeletonLine className="w-1/2 h-10" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="h-11 rounded-xl" />
    </SkeletonCard>
  );
}

function buildPlanFeatures(plan: SubscriptionPlanResponse): string[] {
  const features: string[] = [];
  if (plan.quotaAi === -1) {
    features.push('AI không giới hạn (tối đa 500 lượt/tháng)');
  } else {
    features.push(`${plan.quotaAi} lượt chấm AI`);
  }
  if (plan.quotaExpert > 0) {
    features.push(`${plan.quotaExpert} lượt Giảng viên chấm`);
  }
  features.push(`Hiệu lực ${plan.durationDays} ngày`);
  return features;
}

interface SubscriptionCardProps {
  plan: SubscriptionPlanResponse;
  idx: number;
  activeSub: UserSubscriptionResponse | null;
  onSelect: (plan: SubscriptionPlanResponse) => void;
}

function SubscriptionCard({ plan, idx, activeSub, onSelect }: SubscriptionCardProps) {
  const style = SUB_STYLES[idx % SUB_STYLES.length];
  const isActive = activeSub?.planId === plan.id;
  const features = buildPlanFeatures(plan);

  let btnLabel = 'Đăng ký ngay';
  if (isActive) btnLabel = 'Gia hạn';
  else if (activeSub) btnLabel = 'Đổi gói';

  return (
    <div
      className={`relative rounded-2xl p-5 bg-gradient-to-br ${style.gradient} border-2 ${style.border} transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col`}
    >
      {style.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-md whitespace-nowrap">
          Phổ biến
        </div>
      )}
      {isActive && (
        <div className="absolute -top-3 right-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-md">
          <BadgeCheck className="h-3 w-3" />
          Đang dùng
        </div>
      )}

      <h3 className="font-bold text-lg mb-1">{plan.name}</h3>

      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-extrabold">{formatVND(plan.priceVnd)}</span>
        <span className="text-sm text-gray-500">/tháng</span>
      </div>

      <ul className="space-y-1.5 mb-5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(plan)}
        className={`w-full rounded-xl h-11 text-white font-semibold ${style.btn}`}
      >
        <Sparkles className="h-4 w-4 mr-1.5" />
        {btnLabel}
      </Button>
    </div>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const { setSelectedPackage, setCheckoutItem } = usePaymentStore();

  const { data: packages = [], isLoading: pkgLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const pkgs = await getPackages();
      return pkgs.filter((p) => p.isActive);
    },
  });

  const { data: services = [], isLoading: svcLoading } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const all = await listPlans();
      return all.filter((p) => p.isActive);
    },
  });

  const { data: activeSub = null } = useQuery<UserSubscriptionResponse | null>({
    queryKey: ['my-active-subscription'],
    queryFn: getMyActiveSubscription,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const loading = pkgLoading || svcLoading;

  const handleSelectPackage = (pkg: PackagePricingResponse) => {
    setSelectedPackage(pkg);
    router.push('/payment/checkout');
  };

  const handleSelectPlan = (plan: SubscriptionPlanResponse) => {
    setCheckoutItem({ type: 'subscription', data: plan });
    router.push('/payment/checkout');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Nạp tiền & Gói tháng
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Chọn gói phù hợp với bạn</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Nạp ví trả phí theo lượt hoặc mua gói tháng để tiết kiệm hơn
        </p>
      </div>

      {/* ── Section 1: Gói tháng ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Crown className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Gói tháng</h2>
            <p className="text-xs text-muted-foreground">Mua một lần, dùng suốt tháng — tiết kiệm hơn trả theo lượt</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {plansLoading
            ? Array.from({ length: 3 }).map((_, i) => <PackageSkeleton key={i} />)
            : plans.map((plan, idx) => (
                <SubscriptionCard
                  key={plan.id}
                  plan={plan}
                  idx={idx}
                  activeSub={activeSub}
                  onSelect={handleSelectPlan}
                />
              ))}
        </div>
      </section>

      {/* ── Section 2: Nạp ví VND ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Nạp ví VND</h2>
            <p className="text-xs text-muted-foreground">Trả phí theo lượt, không giới hạn thời gian</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <PackageSkeleton key={i} />)
            : packages.map((pkg, idx) => {
                const style = TIER_STYLES[idx % TIER_STYLES.length];
                const isPopular = idx === 1;
                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-2xl p-6 bg-gradient-to-br ${style.gradient} border-2 ${style.border} transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-violet-500 text-white text-xs font-semibold shadow-md">
                        Phổ biến
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      {style.icon}
                      <h3 className="font-bold text-lg">{pkg.name}</h3>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl font-extrabold">
                        {formatVnd(pkg.creditAmount)}
                      </span>
                    </div>

                    <p className="text-lg font-semibold text-gray-700 mb-5">
                      {formatVND(pkg.price)}
                    </p>

                    <Button
                      onClick={() => handleSelectPackage(pkg)}
                      className={`w-full rounded-xl h-11 text-white font-semibold ${style.btn} mt-auto`}
                    >
                      <Zap className="h-4 w-4 mr-1.5" />
                      Chọn gói này
                    </Button>
                  </div>
                );
              })}
        </div>
      </section>

      {/* Services pricing reference */}
      <section className="bg-gray-50/80 rounded-2xl p-6 border">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Chi phí dịch vụ</h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="bg-white rounded-xl p-4 flex justify-between items-center gap-3 border hover:border-primary/30 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{svc.name}</p>
                  {svc.description && (
                    <p className="text-gray-400 text-xs mt-0.5">{svc.description}</p>
                  )}
                </div>
                <span className="text-primary font-bold text-sm whitespace-nowrap flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-full">
                  {formatVnd(svc.creditCost)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History link */}
      <div className="text-center">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href="/transactions">
            <Receipt className="h-4 w-4 mr-1.5" />
            Xem lịch sử thanh toán
          </Link>
        </Button>
      </div>
    </div>
  );
}
