import { create } from 'zustand';
import type { PackagePricingResponse, PaymentInitResponse } from '@/types/payment.types';

interface PaymentStore {
  selectedPackage: PackagePricingResponse | null;
  pendingPayment: PaymentInitResponse | null;
  setSelectedPackage: (pkg: PackagePricingResponse) => void;
  setPendingPayment: (payment: PaymentInitResponse | null) => void;
  clear: () => void;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  selectedPackage: null,
  pendingPayment: null,
  setSelectedPackage: (pkg) => set({ selectedPackage: pkg }),
  setPendingPayment: (payment) => set({ pendingPayment: payment }),
  clear: () => set({ selectedPackage: null, pendingPayment: null }),
}));
