import { apiClient } from '@/lib/api-client';
import type {
  PackagePricingResponse,
  PackagePricingCreateRequest,
  PackagePricingUpdateRequest,
  PaymentInitResponse,
  PaymentResponse,
  CreditTransactionResponse,
  ServicePricingResponse,
  ServicePricingCreateRequest,
  ServicePricingUpdateRequest,
} from '@/types/payment.types';
import type { ApiResponse } from '@/types/auth.types';

// These endpoints return bare arrays (no ApiResponse wrapper)
export async function getPackages(): Promise<PackagePricingResponse[]> {
  return apiClient.get<PackagePricingResponse[]>('/packages', true);
}

export async function getPackageById(id: string): Promise<PackagePricingResponse> {
  return apiClient.get<PackagePricingResponse>(`/packages/${id}`, true);
}

export async function createPackage(data: PackagePricingCreateRequest): Promise<PackagePricingResponse> {
  return apiClient.post<PackagePricingResponse>('/packages', data, true);
}

export async function updatePackage(id: string, data: PackagePricingUpdateRequest): Promise<PackagePricingResponse> {
  return apiClient.put<PackagePricingResponse>(`/packages/${id}`, data, true);
}

export async function deletePackage(id: string): Promise<void> {
  await apiClient.delete(`/packages/${id}`, true);
}

export async function initPayment(packageId: number, amount: number): Promise<PaymentInitResponse> {
  return apiClient.post<PaymentInitResponse>(
    '/payments/init',
    { packageId, amount },
    true
  );
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

export async function getCreditTransactionById(id: string): Promise<CreditTransactionResponse> {
  return apiClient.get<CreditTransactionResponse>(`/credit-transactions/${id}`, true);
}

export async function getServices(): Promise<ServicePricingResponse[]> {
  return apiClient.get<ServicePricingResponse[]>('/services', true);
}

export async function getServiceById(id: string): Promise<ServicePricingResponse> {
  return apiClient.get<ServicePricingResponse>(`/services/${id}`, true);
}

export async function createService(data: ServicePricingCreateRequest): Promise<ServicePricingResponse> {
  return apiClient.post<ServicePricingResponse>('/services', data, true);
}

export async function updateService(id: string, data: ServicePricingUpdateRequest): Promise<ServicePricingResponse> {
  return apiClient.put<ServicePricingResponse>(`/services/${id}`, data, true);
}

export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`/services/${id}`, true);
}

/**
 * Trạng thái quota miễn phí 1 lượt/ngày cho user hiện tại.
 * Chỉ có ý nghĩa với AI_WRITING_SCORE và AI_SPEAKING_SCORE.
 */
export interface ServiceQuotaResponse {
  serviceCode: string;
  defaultCost: number;
  usedToday: boolean;
  effectiveCost: number;
}

export async function getServiceQuota(serviceCode: string): Promise<ServiceQuotaResponse> {
  return apiClient.get<ServiceQuotaResponse>(`/services/quota/${serviceCode}`, true);
}
