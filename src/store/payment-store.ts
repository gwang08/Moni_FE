import { create } from 'zustand';
import type { PackagePricingResponse, PaymentInitResponse } from '@/types/payment.types';

interface PaymentStore {
  selectedPackage: PackagePricingResponse | null;
  pendingPayment: PaymentInitResponse | null;
  returnUrl: string | null;
  setSelectedPackage: (pkg: PackagePricingResponse) => void;
  setPendingPayment: (payment: PaymentInitResponse | null) => void;
  setReturnUrl: (url: string | null) => void;
  clear: () => void;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  selectedPackage: null,
  pendingPayment: null,
  returnUrl: null,
  setSelectedPackage: (pkg) => set({ selectedPackage: pkg }),
  setPendingPayment: (payment) => set({ pendingPayment: payment }),
  setReturnUrl: (url) => set({ returnUrl: url }),
  clear: () => set({ selectedPackage: null, pendingPayment: null, returnUrl: null }),
}));
