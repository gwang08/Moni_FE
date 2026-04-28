'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
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
import { initPayment, initPaymentForSubscription, getPayments } from '@/lib/payment-api';
import { usePaymentStore } from '@/store/payment-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { formatVnd } from '@/lib/utils';

const formatVND = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + ' đ';

/** Parse LocalDateTime string from backend as UTC (server runs in UTC) */
function parseLocalDateTime(dt: string): number {
  if (!dt.includes('Z') && !dt.includes('+')) {
    const [datePart, timePart] = dt.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mm, ssRaw] = (timePart || '').split(':');
    const ss = Math.floor(parseFloat(ssRaw || '0'));
    return Date.UTC(y, m - 1, d, Number(hh), Number(mm), ss);
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
  const { selectedPackage, checkoutItem, pendingPayment, setPendingPayment, clear } = usePaymentStore();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired' | 'error'>(
    'pending'
  );
  const [error, setError] = useState<string | null>(null);
  const { display: countdown, expired } = useCountdown(
    pendingPayment?.expiredAt ?? null
  );

  // Derive a display-friendly item for the receipt card (works for both package & subscription)
  const displayItem = checkoutItem
    ? checkoutItem.type === 'subscription'
      ? {
          name: checkoutItem.data.name,
          subtitle: `Gói chấm điểm · ${checkoutItem.data.durationDays} ngày`,
          amount: checkoutItem.data.priceVnd,
        }
      : {
          name: checkoutItem.data.name,
          subtitle: `Gói ${checkoutItem.data.quotaAi} lượt AI + ${checkoutItem.data.quotaExpert} lượt GV`,
          amount: checkoutItem.data.price,
        }
    : selectedPackage
    ? {
        name: selectedPackage.name,
        subtitle: `Gói ${selectedPackage.quotaAi} lượt AI + ${selectedPackage.quotaExpert} lượt GV`,
        amount: selectedPackage.price,
      }
    : null;

  const initCalled = useRef(false);
  useEffect(() => {
    // Need either a checkoutItem or legacy selectedPackage
    if (!checkoutItem && !selectedPackage) {
      router.replace('/payment');
      return;
    }
    if (initCalled.current) return;
    initCalled.current = true;
    const init = async () => {
      // Check if we can reuse the existing pending payment from localStorage
      if (pendingPayment && pendingPayment.expiredAt && displayItem) {
        const expiresMs = parseLocalDateTime(pendingPayment.expiredAt);
        // Reuse if it's the exact same amount and has more than 10 seconds remaining
        if (expiresMs > Date.now() + 10000 && pendingPayment.amount === displayItem.amount) {
          setLoading(false);
          return;
        }
      }

      try {
        let payment;
        if (checkoutItem?.type === 'subscription') {
          payment = await initPaymentForSubscription(
            checkoutItem.data.id,
            checkoutItem.data.priceVnd
          );
        } else {
          // Legacy package top-up
          const pkg = checkoutItem?.type === 'package' ? checkoutItem.data : selectedPackage!;
          payment = await initPayment(pkg.id, pkg.price);
        }
        // Fix backend QR URL where acc/bank params are swapped
        if (payment.qrCodeUrl) {
          const url = new URL(payment.qrCodeUrl);
          const acc = url.searchParams.get('acc');
          const bank = url.searchParams.get('bank');
          if (acc && bank && isNaN(Number(acc))) {
            url.searchParams.set('acc', bank);
            url.searchParams.set('bank', acc);
            payment.qrCodeUrl = url.toString();
          }
        }
        setPendingPayment(payment);
      } catch {
        setError('Không thể khởi tạo thanh toán. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutItem, selectedPackage, displayItem]);

  const { refreshProfile } = useAuthStore();
  const queryClient = useQueryClient();

  const returnUrl = usePaymentStore((s) => s.returnUrl);

  const handlePaymentSuccess = useCallback(
    () => {
      setStatus('completed');
      refreshProfile();
      // Invalidate subscription query so banner/scoring dialogs pick up new active sub immediately
      queryClient.invalidateQueries({ queryKey: ['my-active-subscription'] });
      const redirectTo = returnUrl || '/transactions';
      setTimeout(() => {
        clear();
        router.push(redirectTo);
      }, 2500);
    },
    [clear, router, refreshProfile, returnUrl, queryClient]
  );

  // SSE realtime listener + polling fallback
  useEffect(() => {
    if (!pendingPayment || status !== 'pending') return;
    if (expired) {
      // Final DB check before declaring expired — SSE may have been delayed/dropped
      const doFinalCheck = async () => {
        try {
          const payments = await getPayments();
          const match = payments.find(
            (p) => p.id === pendingPayment.id || p.txnCode === pendingPayment.txnCode
          );
          if (match?.status === 'SUCCESS') {
            handlePaymentSuccess();
            return;
          }
        } catch { /* ignore */ }
        setStatus('expired');
      };
      doFinalCheck();
      return;
    }

    let sseConnected = false;

    // 1. Try SSE for instant notification
    const token = useAuthStore.getState().token;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const eventSource = new EventSource(
      `${apiUrl}/payments/subscribe?token=${encodeURIComponent(token || '')}`
    );

    eventSource.addEventListener('payment_success', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.paymentId === pendingPayment.id) {
          handlePaymentSuccess();
        }
      } catch { /* ignore parse errors */ }
    });

    eventSource.onopen = () => { sseConnected = true; };
    eventSource.onerror = () => { sseConnected = false; };

    // 2. Fallback polling every 5s (in case SSE fails or server doesn't support it)
    const pollId = setInterval(async () => {
      if (sseConnected) return; // Skip poll if SSE is active
      try {
        const payments = await getPayments();
        const match = payments.find(
          (p) => p.id === pendingPayment.id || p.txnCode === pendingPayment.txnCode
        );
        if (match?.status === 'SUCCESS') {
          handlePaymentSuccess();
        }
      } catch { /* ignore */ }
    }, 5000);

    return () => {
      eventSource.close();
      clearInterval(pollId);
    };
  }, [pendingPayment, status, expired, handlePaymentSuccess]);

  if (!displayItem) return null;

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
            {checkoutItem?.type === 'subscription'
              ? 'Gói chấm điểm đã được kích hoạt'
              : 'Giao dịch thành công'}
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
          {/* Item summary card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{displayItem.name}</p>
              <p className="text-xs text-muted-foreground">{displayItem.subtitle}</p>
            </div>
            <p className="text-lg font-extrabold text-primary">
              {formatVND(displayItem.amount)}
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
