export interface PackagePricingResponse {
  id: number;
  name: string;
  category?: string;
  price: number;
  creditAmount: number;
  quotaAi: number;
  quotaExpert: number;
  isActive: boolean;
}

export interface PaymentInitResponse {
  id: number;
  txnCode: string;
  amount: number;
  qrCodeUrl: string;
  expiredAt: string;
}

export interface PaymentResponse {
  id: number;
  packageId: number | null;
  packageName?: string | null;
  subscriptionPlanId?: number | null;
  subscriptionPlanName?: string | null;
  txnCode: string;
  amount: number;
  updatedAt: string;
  status: string;
  createdAt?: string;
  userId?: string | null;
  userEmail?: string | null;
  userFullName?: string | null;
}

export interface CreditTransactionResponse {
  id: number;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentType: string;
  serviceName: string | null;
  packageName: string | null;
  createdAt: string;
  userId: string;
  userEmail: string | null;
  userFullName: string | null;
  serviceId: number | null;
  paymentId: number | null;
  remark?: string | null;
  quotaType?: string | null; // 'AI' | 'EXPERT' khi dùng quota sub
  quotaBefore?: number | null;
  quotaAfter?: number | null;
}

export interface ServicePricingResponse {
  id: number;
  serviceCode: string;
  name: string;
  description: string;
  creditCost: number;
}

export interface PackagePricingCreateRequest {
  name: string;
  price: number;
  creditAmount: number;
  category?: string;
  quotaAi?: number;
  quotaExpert?: number;
}

export interface PackagePricingUpdateRequest {
  name?: string;
  price?: number;
  creditAmount?: number;
  category?: string;
  quotaAi?: number;
  quotaExpert?: number;
  isActive?: boolean;
}

export interface ServicePricingCreateRequest {
  serviceCode: string;
  name: string;
  description?: string;
  creditCost: number;
}

export interface ServicePricingUpdateRequest {
  serviceCode: string;
  name: string;
  description?: string;
  creditCost: number;
}
