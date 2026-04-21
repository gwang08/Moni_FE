'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Zap, Receipt, Crown, CheckCircle2, BadgeCheck, Route, CalendarCheck, Target, Brain, Award } from 'lucide-react';
import { getPackages, getServices } from '@/lib/payment-api';
import { listPlans, getMyActiveSubscription, getRoadmapSubscriptionStatus } from '@/lib/subscription-api';
import { usePaymentStore } from '@/store/payment-store';
import { Button } from '@/components/ui/button';
import { formatVnd } from '@/lib/utils';
import { SkeletonCard, SkeletonLine } from '@/components/ui/skeleton';
import type { PackagePricingResponse } from '@/types/payment.types';
import type { SubscriptionPlanResponse, UserSubscriptionResponse } from '@/types/subscription.types';

const formatVND = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + ' đ';

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
      return all.filter((p) => p.isActive && (p.category === 'SCORING' || !p.category));
    },
  });

  const { data: roadmapPlans = [], isLoading: roadmapPlansLoading } = useQuery({
    queryKey: ['roadmap-plans'],
    queryFn: async () => {
      const all = await listPlans();
      return all.filter((p) => p.isActive && p.category === 'ROADMAP');
    },
  });

  const { data: roadmapStatus } = useQuery({
    queryKey: ['my-roadmap-subscription'],
    queryFn: getRoadmapSubscriptionStatus,
    staleTime: 5 * 60 * 1000,
    retry: false,
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
          Nạp tiền & Gói chấm điểm tháng
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Chọn gói phù hợp với bạn</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Nạp ví trả phí theo lượt hoặc mua gói chấm điểm tháng để tiết kiệm hơn
        </p>
      </div>

      {/* ── Section 0: Gói Lộ Trình ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100">
            <Route className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Gói Lộ Trình Học</h2>
            <p className="text-xs text-muted-foreground">Được AI lên kế hoạch học tập cá nhân, tối ưu hóa ôn luyện IELTS</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {roadmapPlansLoading
            ? Array.from({ length: 1 }).map((_, i) => <PackageSkeleton key={i} />)
            : roadmapPlans.length > 0
            ? roadmapPlans.map((plan, idx) => {
                const isActive = roadmapStatus?.subscription?.planId === plan.id && roadmapStatus?.hasActiveSubscription;
                const roadmapFeatures = [
                  { icon: CalendarCheck, text: 'Lộ trình học từng tuần được AI cá nhân hóa' },
                  { icon: Target, text: 'Bài tập tập trung vào điểm yếu của bạn' },
                  { icon: Brain, text: 'Phân tích mastery & confidence từng chủ đề' },
                  { icon: Award, text: 'Đánh giá tổng hợp cuối tháng' },
                ];

                let btnLabel = 'Đăng ký ngay';
                if (isActive) btnLabel = 'Gia hạn';

                return (
                  <div
                    key={plan.id}
                    className="relative rounded-2xl p-5 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300 hover:border-indigo-500 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col"
                  >
                    {isActive && (
                      <div className="absolute -top-3 right-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-md">
                        <BadgeCheck className="h-3 w-3" />
                        Đang dùng
                      </div>
                    )}

                    <h3 className="font-bold text-lg mb-1">{plan.name}</h3>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-extrabold">{formatVND(plan.priceVnd)}</span>
                      <span className="text-sm text-gray-500">/{plan.durationDays} ngày</span>
                    </div>

                    {plan.description && (
                      <p className="text-xs text-gray-600 mb-3">{plan.description}</p>
                    )}

                    <ul className="space-y-2 mb-5 flex-1">
                      {roadmapFeatures.map((f) => (
                        <li key={f.text} className="flex items-start gap-2 text-sm text-gray-700">
                          <f.icon className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                          {f.text}
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      className="w-full rounded-xl h-11 text-white font-semibold bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      {btnLabel}
                    </Button>
                  </div>
                );
              })
            : (
              <div className="col-span-full text-center py-8 text-gray-400 text-sm">
                Chưa có gói Lộ Trình nào. Vui lòng liên hệ admin.
              </div>
            )}
        </div>
      </section>

      {/* ── Section 1: Gói chấm điểm tháng ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Crown className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Gói chấm điểm tháng</h2>
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <PackageSkeleton key={i} />)
            : packages.map((pkg, idx) => {
                const bonus = pkg.creditAmount - pkg.price;
                const bonusPct = pkg.price > 0 ? Math.round((bonus / pkg.price) * 100) : 0;
                const hasBonus = bonus > 0;
                return (
                  <button
                    type="button"
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`relative text-left rounded-xl border-2 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                      hasBonus
                        ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500'
                        : 'border-gray-200 bg-white hover:border-emerald-400'
                    }`}
                  >
                    {hasBonus && (
                      <span className="absolute -top-2 right-3 bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
                        +{bonusPct}%
                      </span>
                    )}
                    <div className="text-xl font-bold text-gray-800">
                      {formatVND(pkg.price)}
                    </div>
                    <div className={`text-xs mt-1 ${hasBonus ? 'text-emerald-600 font-semibold' : 'text-gray-500'}`}>
                      Nhận {formatVnd(pkg.creditAmount)}
                    </div>
                  </button>
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
