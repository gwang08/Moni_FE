import { apiClient } from '@/lib/api-client';
import type {
  PackagePricingResponse,
  PaymentInitResponse,
  PaymentResponse,
  CreditTransactionResponse,
  ServicePricingResponse,
} from '@/types/payment.types';
import type { ApiResponse } from '@/types/auth.types';

// These endpoints return bare arrays (no ApiResponse wrapper)
export async function getPackages(): Promise<PackagePricingResponse[]> {
  return apiClient.get<PackagePricingResponse[]>('/packages', true);
}

export async function initPayment(packageId: string): Promise<PaymentInitResponse> {
  const response = await apiClient.post<ApiResponse<PaymentInitResponse>>(
    '/payments/init',
    { packageId },
    true
  );
  if (!response.result) throw new Error('Failed to init payment');
  return response.result;
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
  const response = await apiClient.get<ApiResponse<PaymentResponse>>(
    `/payments/${paymentId}`,
    true
  );
  if (!response.result) throw new Error('Failed to get payment status');
  return response.result;
}

export async function getPayments(): Promise<PaymentResponse[]> {
  return apiClient.get<PaymentResponse[]>('/payments', true);
}

export async function getCreditTransactions(): Promise<CreditTransactionResponse[]> {
  return apiClient.get<CreditTransactionResponse[]>('/credit-transactions', true);
}

export async function getServices(): Promise<ServicePricingResponse[]> {
  return apiClient.get<ServicePricingResponse[]>('/services', true);
}
