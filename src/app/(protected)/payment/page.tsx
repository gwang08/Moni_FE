'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Zap, Receipt, Crown, CheckCircle2, BadgeCheck, Route, CalendarCheck, Target, Brain, Award, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getPackages, getServices } from '@/lib/payment-api';
import { listPlans, getMyActiveSubscription, getRoadmapSubscriptionStatus, purchaseWithCredit } from '@/lib/subscription-api';
import { usePaymentStore } from '@/store/payment-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  const queryClient = useQueryClient();
  const { setSelectedPackage, setCheckoutItem } = usePaymentStore();
  const creditBalance = useAuthStore((s) => s.user?.credit ?? 0);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  // Credit purchase dialog state
  const [creditDialog, setCreditDialog] = useState<{ open: boolean; plan: SubscriptionPlanResponse | null }>({
    open: false,
    plan: null,
  });
  const [purchasing, setPurchasing] = useState(false);

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
    if (creditBalance >= plan.priceVnd) {
      // Đủ tiền → hiện dialog xác nhận trừ credit
      setCreditDialog({ open: true, plan });
    } else {
      // Không đủ → qua checkout QR
      setCheckoutItem({ type: 'subscription', data: plan });
      router.push('/payment/checkout');
    }
  };

  const handleCreditPurchase = async () => {
    if (!creditDialog.plan) return;
    setPurchasing(true);
    try {
      await purchaseWithCredit(creditDialog.plan.id);
      toast.success(`Đã kích hoạt ${creditDialog.plan.name} thành công!`);
      setCreditDialog({ open: false, plan: null });
      // Refresh data
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['my-active-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['my-roadmap-subscription'] });
    } catch {
      toast.error('Mua gói thất bại. Vui lòng thử lại.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Gói lượt chấm lẻ & Gói tháng
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Chọn gói phù hợp với bạn</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Mua lượt chấm bài lẻ hoặc đăng ký gói tháng để tối ưu chi phí học tập
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

                    {/* Quota highlight — cho user biết rõ được bao nhiêu lượt AI + Giảng viên */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-lg bg-white/70 border border-indigo-200 px-2.5 py-2 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Lượt AI</div>
                        <div className="text-lg font-extrabold text-indigo-700 tabular-nums">
                          {plan.quotaAi === -1 ? '∞' : plan.quotaAi.toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white/70 border border-purple-200 px-2.5 py-2 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Giảng viên</div>
                        <div className="text-lg font-extrabold text-purple-700 tabular-nums">
                          {plan.quotaExpert === -1 ? '∞' : plan.quotaExpert.toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>

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

      {/* ── Section 2: Gói lượt chấm cơ bản ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100">
            <Zap className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Gói lượt chấm cơ bản</h2>
            <p className="text-xs text-muted-foreground">Mua lẻ lượt chấm AI, không giới hạn thời gian sử dụng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pkgLoading
            ? Array.from({ length: 3 }).map((_, i) => <PackageSkeleton key={i} />)
            : packages
                .filter((p) => p.category === 'BASIC' || (!p.category && !p.name.toUpperCase().includes('PRO')))
                .map((pkg) => {
                  const turns = Math.round(pkg.creditAmount / 10000);
                  const discount = pkg.price < turns * 10000 ? turns * 10000 - pkg.price : 0;

                  return (
                    <div
                      key={pkg.id}
                      className="relative rounded-2xl p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col"
                    >
                      {discount > 0 && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#F97316] text-white text-[10px] font-bold shadow-md whitespace-nowrap">
                          Tiết kiệm {formatVnd(discount)}
                        </div>
                      )}

                      <h3 className="font-bold text-lg mb-1 text-gray-800">Gói {turns} lượt chấm</h3>

                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-3xl font-extrabold text-gray-900">{formatVnd(pkg.price)}</span>
                        {discount > 0 && (
                          <span className="text-xs text-gray-400 line-through font-medium ml-1">
                            {formatVnd(turns * 10000)}
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="rounded-xl bg-white/70 border border-emerald-200 px-3 py-2 text-center">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                            Tổng cộng
                          </div>
                          <div className="text-xl font-black text-emerald-700">
                            {turns} <span className="text-sm font-bold">Lượt chấm AI</span>
                          </div>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-5 flex-1">
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          Chấm full Speaking & Writing Task 1/2
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          Không hết hạn lượt chấm
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          Tự động đồng bộ vào Lộ trình
                        </li>
                      </ul>

                      <Button
                        onClick={() => handleSelectPackage(pkg)}
                        className="w-full rounded-xl h-11 text-white font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200"
                      >
                        <Sparkles className="h-4 w-4 mr-1.5" />
                        Mua ngay
                      </Button>
                    </div>
                  );
                })}
        </div>
      </section>

      {/* ── Section 3: Gói chấm điểm Pro ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Crown className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Gói chấm điểm Pro</h2>
            <p className="text-xs text-muted-foreground">Bao gồm lượt chấm chi tiết từ Giảng viên/Mentor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pkgLoading
            ? Array.from({ length: 3 }).map((_, i) => <PackageSkeleton key={i} />)
            : packages
                .filter((p) => p.category === 'PRO' || (!p.category && p.name.toUpperCase().includes('PRO')))
                .map((pkg) => {
                  const totalVnd = pkg.creditAmount;
                  const expertTurns = Math.floor(totalVnd / 40000); 
                  const aiTurns = Math.floor((totalVnd % 40000) / 10000) + 10; 

                  return (
                    <div
                      key={pkg.id}
                      className="relative rounded-2xl p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 hover:border-indigo-400 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col"
                    >
                      <h3 className="font-bold text-lg mb-1 text-gray-800">{pkg.name}</h3>

                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-3xl font-extrabold text-indigo-600">{formatVnd(pkg.price)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="rounded-xl bg-white/70 border border-emerald-200 px-2 py-2 text-center">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Lượt AI</div>
                          <div className="text-lg font-black text-emerald-700">{aiTurns}</div>
                        </div>
                        <div className="rounded-xl bg-white/70 border border-indigo-200 px-2 py-2 text-center">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-indigo-600">Mentor</div>
                          <div className="text-lg font-black text-indigo-700">{expertTurns}</div>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-5 flex-1">
                        <li className="flex items-start gap-2 text-sm text-gray-700 font-bold">
                          <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                          Chấm & Feedback chi tiết từ Mentor
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                          Chấm full Speaking & Writing Task 1/2
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                          Ưu tiên trả kết quả sớm nhất
                        </li>
                      </ul>

                      <Button
                        onClick={() => handleSelectPackage(pkg)}
                        className="w-full rounded-xl h-11 text-white font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                      >
                        <Crown className="h-4 w-4 mr-1.5" />
                        Đăng ký ngay
                      </Button>
                    </div>
                  );
                })}
          {packages.filter((p) => p.category === 'PRO' || (!p.category && p.name.toUpperCase().includes('PRO'))).length === 0 && (
            <div className="col-span-full text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-sm text-gray-400">Gói Pro sắp ra mắt với tính năng chấm Mentor chi tiết.</p>
            </div>
          )}
        </div>
      </section>

      {/* History link */}
      <div className="text-center pt-4">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href="/transactions">
            <Receipt className="h-4 w-4 mr-1.5" />
            Xem lịch sử thanh toán
          </Link>
        </Button>
      </div>

      {/* Credit Purchase Confirmation Dialog */}
      <Dialog open={creditDialog.open} onOpenChange={(open) => !purchasing && setCreditDialog({ open, plan: open ? creditDialog.plan : null })}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden">
          {creditDialog.plan && (
            <>
              {/* Header gradient */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-6 pb-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{creditDialog.plan.name}</h3>
                    <p className="text-indigo-100 text-xs mt-0.5">{creditDialog.plan.durationDays} ngày sử dụng</p>
                  </div>
                </div>
                <div className="text-3xl font-extrabold tracking-tight">
                  {formatVND(creditDialog.plan.priceVnd)}
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center justify-between py-2.5 border-b border-dashed border-gray-200">
                  <span className="text-sm text-gray-500">Số dư hiện tại</span>
                  <span className="text-sm font-bold text-gray-800">{formatVnd(creditBalance)}</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-gray-500">Số dư sau khi mua</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {formatVnd(creditBalance - creditDialog.plan.priceVnd)}
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl font-semibold"
                    onClick={() => setCreditDialog({ open: false, plan: null })}
                    disabled={purchasing}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleCreditPurchase}
                    disabled={purchasing}
                    className="flex-1 h-11 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700"
                  >
                    {purchasing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                    Xác nhận
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
