'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package, Wrench } from 'lucide-react';
import { getPackages, getServices } from '@/lib/payment-api';
import { usePaymentStore } from '@/store/payment-store';
import { Button } from '@/components/ui/button';
import type { PackagePricingResponse, ServicePricingResponse } from '@/types/payment.types';

const formatVND = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + ' đ';

function PackageSkeleton() {
  return (
    <div className="border rounded-xl p-6 bg-white animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-full mb-4" />
      <div className="h-10 bg-gray-200 rounded" />
    </div>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const { setSelectedPackage } = usePaymentStore();
  const [packages, setPackages] = useState<PackagePricingResponse[]>([]);
  const [services, setServices] = useState<ServicePricingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [pkgs, svcs] = await Promise.all([getPackages(), getServices()]);
        setPackages(pkgs.filter((p) => p.isActive));
        setServices(svcs.filter((s) => s.isActive));
      } catch {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelect = (pkg: PackagePricingResponse) => {
    setSelectedPackage(pkg);
    router.push('/payment/checkout');
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-red-500">{error}</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Mua gói tín dụng</h1>
      </div>

      {/* Packages grid */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Chọn gói</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <PackageSkeleton key={i} />)
            : packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <h3 className="font-semibold text-base mb-1">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-primary mb-1">
                    {pkg.credits.toLocaleString('vi-VN')} tín dụng
                  </p>
                  <p className="text-gray-500 text-sm mb-3 flex-1">{pkg.description}</p>
                  <p className="font-medium text-gray-800 mb-4">{formatVND(pkg.price)}</p>
                  <Button onClick={() => handleSelect(pkg)} className="w-full">
                    Chọn gói
                  </Button>
                </div>
              ))}
        </div>
      </section>

      {/* Services section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Dịch vụ</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((svc) => (
              <div key={svc.id} className="border rounded-lg p-4 bg-white flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium text-sm">{svc.serviceName}</p>
                  <p className="text-gray-500 text-xs mt-1">{svc.description}</p>
                </div>
                <span className="text-primary font-semibold text-sm whitespace-nowrap">
                  {svc.creditCost} tín dụng
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
