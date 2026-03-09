'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Zap, Receipt, Crown, Star } from 'lucide-react';
import { getPackages, getServices } from '@/lib/payment-api';
import { usePaymentStore } from '@/store/payment-store';
import { Button } from '@/components/ui/button';
import type { PackagePricingResponse } from '@/types/payment.types';

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

function PackageSkeleton() {
  return (
    <div className="rounded-2xl p-6 bg-white animate-pulse border">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-10 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-full mb-5" />
      <div className="h-11 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const { setSelectedPackage } = usePaymentStore();

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

  const loading = pkgLoading || svcLoading;

  const handleSelect = (pkg: PackagePricingResponse) => {
    setSelectedPackage(pkg);
    router.push('/payment/checkout');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Nạp credit - Sử dụng dịch vụ
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Chọn gói phù hợp với bạn</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Mua credit để sử dụng các tính năng AI luyện IELTS Speaking
        </p>
      </div>

      {/* Packages grid */}
      <section>
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
                        {pkg.creditAmount.toLocaleString('vi-VN')}
                      </span>
                      <Image
                        src="/currency"
                        alt="credit"
                        width={28}
                        height={28}
                        className="h-7 w-7 object-contain"
                      />
                    </div>

                    <p className="text-lg font-semibold text-gray-700 mb-5">
                      {formatVND(pkg.price)}
                    </p>

                    <Button
                      onClick={() => handleSelect(pkg)}
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

      {/* Services section */}
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
                  {svc.creditCost}
                  <Image
                    src="/currency"
                    alt="credit"
                    width={16}
                    height={16}
                    className="h-4 w-4 object-contain"
                  />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History link */}
      <div className="text-center">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href="/payment/history">
            <Receipt className="h-4 w-4 mr-1.5" />
            Xem lịch sử thanh toán
          </Link>
        </Button>
      </div>
    </div>
  );
}
