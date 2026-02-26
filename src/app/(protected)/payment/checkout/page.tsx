'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { initPayment, getPaymentStatus } from '@/lib/payment-api';
import { usePaymentStore } from '@/store/payment-store';
import { Button } from '@/components/ui/button';

const formatVND = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + ' đ';

function useCountdown(expiresAt: string | null) {
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    setSeconds(calc());
    const id = setInterval(() => setSeconds(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return { display: `${mm}:${ss}`, expired: seconds === 0 };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { selectedPackage, pendingPayment, setPendingPayment, clear } = usePaymentStore();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);
  const { display: countdown, expired } = useCountdown(pendingPayment?.expiresAt ?? null);

  // Init payment on mount
  useEffect(() => {
    if (!selectedPackage) {
      router.replace('/payment');
      return;
    }
    let cancelled = false;
    const init = async () => {
      try {
        const payment = await initPayment(selectedPackage.id);
        if (!cancelled) setPendingPayment(payment);
      } catch {
        if (!cancelled) setError('Không thể khởi tạo thanh toán. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll payment status
  const pollStatus = useCallback(async () => {
    if (!pendingPayment) return;
    try {
      const result = await getPaymentStatus(pendingPayment.paymentId);
      if (result.status === 'COMPLETED') {
        setStatus('completed');
        setTimeout(() => { clear(); router.push('/payment/history'); }, 2000);
      }
    } catch { /* ignore polling errors */ }
  }, [pendingPayment, clear, router]);

  useEffect(() => {
    if (!pendingPayment || status !== 'pending') return;
    if (expired) { setStatus('expired'); return; }
    const id = setInterval(pollStatus, 5000);
    return () => clearInterval(id);
  }, [pendingPayment, pollStatus, status, expired]);

  if (!selectedPackage) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <p className="text-red-600">{error}</p>
        <Button variant="outline" onClick={() => router.push('/payment')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/payment')}>
        <ArrowLeft className="h-4 w-4 mr-1" />Quay lại
      </Button>

      <h1 className="text-xl font-bold">Thanh toán</h1>

      {/* Package summary */}
      <div className="border rounded-xl p-4 bg-white space-y-1">
        <p className="font-semibold">{selectedPackage.name}</p>
        <p className="text-sm text-gray-500">{selectedPackage.credits.toLocaleString('vi-VN')} tín dụng</p>
        <p className="text-lg font-bold text-primary">{formatVND(selectedPackage.price)}</p>
      </div>

      {status === 'completed' && (
        <div className="flex flex-col items-center gap-3 py-8 text-green-600">
          <CheckCircle2 className="h-12 w-12" />
          <p className="font-semibold text-lg">Thanh toán thành công!</p>
          <p className="text-sm text-gray-500">Đang chuyển hướng...</p>
        </div>
      )}

      {status === 'expired' && (
        <div className="flex flex-col items-center gap-3 py-6 text-gray-500">
          <AlertCircle className="h-10 w-10" />
          <p className="font-semibold">Giao dịch đã hết hạn</p>
          <Button onClick={() => router.push('/payment')}>Chọn lại gói</Button>
        </div>
      )}

      {status === 'pending' && pendingPayment && (
        <div className="space-y-4">
          {/* QR code */}
          <div className="flex justify-center">
            <img
              src={pendingPayment.qrCodeUrl}
              alt="QR thanh toán"
              className="w-56 h-56 border rounded-lg object-contain"
            />
          </div>

          {/* Transfer info */}
          <div className="border rounded-lg p-4 bg-gray-50 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nội dung chuyển khoản</span>
              <span className="font-mono font-medium">{pendingPayment.content}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số tiền</span>
              <span className="font-semibold">{formatVND(pendingPayment.amount)}</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Hết hạn sau</p>
            <p className="text-2xl font-mono font-bold text-primary">{countdown}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang chờ xác nhận thanh toán...
          </div>
        </div>
      )}
    </div>
  );
}
