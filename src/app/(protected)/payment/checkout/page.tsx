'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { initPayment, getPayments } from '@/lib/payment-api';
import { usePaymentStore } from '@/store/payment-store';
import { Button } from '@/components/ui/button';

const formatVND = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + ' đ';

/** Parse LocalDateTime string from backend as local timezone (not UTC) */
function parseLocalDateTime(dt: string): number {
  if (!dt.includes('Z') && !dt.includes('+')) {
    const [datePart, timePart] = dt.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mm, ssRaw] = (timePart || '').split(':');
    const ss = Math.floor(parseFloat(ssRaw || '0'));
    return new Date(y, m - 1, d, Number(hh), Number(mm), ss).getTime();
  }
  return new Date(dt).getTime();
}

function useCountdown(expiresAt: string | null) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const calc = () =>
      Math.max(0, Math.floor((parseLocalDateTime(expiresAt) - Date.now()) / 1000));
    setSeconds(calc());
    const id = setInterval(() => setSeconds(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const secs = seconds ?? 0;
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return { display: `${mm}:${ss}`, expired: seconds !== null && seconds === 0 };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-200 transition-colors"
      title="Sao chép"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-gray-400" />
      )}
    </button>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { selectedPackage, pendingPayment, setPendingPayment, clear } = usePaymentStore();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired' | 'error'>(
    'pending'
  );
  const [error, setError] = useState<string | null>(null);
  const { display: countdown, expired } = useCountdown(
    pendingPayment?.expiredAt ?? null
  );

  const initCalled = useRef(false);
  useEffect(() => {
    if (!selectedPackage) {
      router.replace('/payment');
      return;
    }
    if (initCalled.current) return;
    initCalled.current = true;
    const init = async () => {
      try {
        const payment = await initPayment(selectedPackage.id, selectedPackage.price);
        setPendingPayment(payment);
      } catch {
        setError('Không thể khởi tạo thanh toán. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollStatus = useCallback(async () => {
    if (!pendingPayment) return;
    try {
      const payments = await getPayments();
      const match = payments.find(
        (p) => p.id === pendingPayment.id || p.txnCode === pendingPayment.txnCode
      );
      if (match?.status === 'SUCCESS') {
        setStatus('completed');
        setTimeout(() => {
          clear();
          router.push('/payment/history');
        }, 2500);
      }
    } catch {
      /* ignore polling errors */
    }
  }, [pendingPayment, clear, router]);

  useEffect(() => {
    if (!pendingPayment || status !== 'pending') return;
    if (expired) {
      setStatus('expired');
      return;
    }
    const id = setInterval(pollStatus, 5000);
    return () => clearInterval(id);
  }, [pendingPayment, pollStatus, status, expired]);

  if (!selectedPackage) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="p-4 rounded-full bg-primary/10 animate-pulse">
          <QrCode className="h-8 w-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Đang tạo mã thanh toán...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="p-4 rounded-full bg-red-50 inline-flex mx-auto">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <p className="text-red-600 font-medium">{error}</p>
        <Button variant="outline" onClick={() => router.push('/payment')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/payment')}
        className="text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Quay lại
      </Button>

      {/* Success state */}
      {status === 'completed' && (
        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-8 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-green-700">Thanh toán thành công!</h2>
          <p className="text-sm text-green-600">
            Credit đã được cộng vào tài khoản
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang chuyển hướng...
          </div>
        </div>
      )}

      {/* Expired state */}
      {status === 'expired' && (
        <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-slate-100 border-2 border-gray-200 p-8 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-gray-100">
            <Clock className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-600">Giao dịch đã hết hạn</h2>
          <p className="text-sm text-gray-500">Vui lòng tạo giao dịch mới</p>
          <Button
            onClick={() => router.push('/payment')}
            className="rounded-xl mt-2"
          >
            Chọn lại gói
          </Button>
        </div>
      )}

      {/* Pending state */}
      {status === 'pending' && pendingPayment && (
        <div className="space-y-5">
          {/* Package card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-white shadow-sm">
              <Image
                src="/currency"
                alt="credit"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{selectedPackage.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedPackage.creditAmount.toLocaleString('vi-VN')} credit
              </p>
            </div>
            <p className="text-lg font-extrabold text-primary">
              {formatVND(selectedPackage.price)}
            </p>
          </div>

          {/* QR code card */}
          <div className="rounded-2xl bg-white border-2 border-gray-100 p-5 space-y-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Quét mã QR để thanh toán
              </p>
            </div>

            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-2xl shadow-md border">
                <img
                  src={pendingPayment.qrCodeUrl}
                  alt="QR thanh toán"
                  className="w-52 h-52 object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Transfer details */}
            <div className="rounded-xl bg-gray-50 p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Nội dung CK</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-primary">
                    {pendingPayment.txnCode}
                  </span>
                  <CopyButton text={pendingPayment.txnCode} />
                </div>
              </div>
              <div className="border-t border-dashed" />
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Số tiền</span>
                <span className="font-bold">{formatVND(pendingPayment.amount)}</span>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-orange-600 font-medium">
                Thời gian còn lại
              </span>
            </div>
            <p className="text-3xl font-mono font-extrabold text-orange-600">
              {countdown}
            </p>
          </div>

          {/* Polling indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Đang chờ xác nhận thanh toán...
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
            <ShieldCheck className="h-3.5 w-3.5" />
            Giao dịch được bảo mật bởi SePay
          </div>
        </div>
      )}
    </div>
  );
}
