import { create } from 'zustand';
import type { PackagePricingResponse, PaymentInitResponse } from '@/types/payment.types';
import type { SubscriptionPlanResponse } from '@/types/subscription.types';

/** Describes what is being purchased: a VND top-up package or a subscription plan. */
export type CheckoutItem =
  | { type: 'package'; data: PackagePricingResponse }
  | { type: 'subscription'; data: SubscriptionPlanResponse };

interface PaymentStore {
  selectedPackage: PackagePricingResponse | null;
  /** New: the item being checked out (package or subscription). */
  checkoutItem: CheckoutItem | null;
  pendingPayment: PaymentInitResponse | null;
  returnUrl: string | null;
  setSelectedPackage: (pkg: PackagePricingResponse) => void;
  setCheckoutItem: (item: CheckoutItem) => void;
  setPendingPayment: (payment: PaymentInitResponse | null) => void;
  setReturnUrl: (url: string | null) => void;
  clear: () => void;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  selectedPackage: null,
  checkoutItem: null,
  pendingPayment: null,
  returnUrl: null,
  setSelectedPackage: (pkg) => set({ selectedPackage: pkg, checkoutItem: { type: 'package', data: pkg } }),
  setCheckoutItem: (item) => set({
    checkoutItem: item,
    // Keep selectedPackage in sync for backward-compat with checkout page
    selectedPackage: item.type === 'package' ? item.data : null,
  }),
  setPendingPayment: (payment) => set({ pendingPayment: payment }),
  setReturnUrl: (url) => set({ returnUrl: url }),
  clear: () => set({ selectedPackage: null, checkoutItem: null, pendingPayment: null, returnUrl: null }),
}));
