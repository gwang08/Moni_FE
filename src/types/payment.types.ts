export interface PackagePricingResponse {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  isActive: boolean;
}

export interface PaymentInitResponse {
  paymentId: string;
  qrCodeUrl: string;
  amount: number;
  content: string;
  expiresAt: string;
}

export interface PaymentResponse {
  id: string;
  amount: number;
  credits: number;
  status: string;
  packageName: string;
  createdAt: string;
  completedAt: string | null;
}

export interface CreditTransactionResponse {
  id: string;
  amount: number;
  type: string;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

export interface ServicePricingResponse {
  id: string;
  serviceName: string;
  serviceCode: string;
  creditCost: number;
  description: string;
  isActive: boolean;
}

export interface PackagePricingCreateRequest {
  name: string;
  credits: number;
  price: number;
  description: string;
  isActive?: boolean;
}

export interface PackagePricingUpdateRequest {
  name?: string;
  credits?: number;
  price?: number;
  description?: string;
  isActive?: boolean;
}

export interface ServicePricingCreateRequest {
  serviceName: string;
  serviceCode: string;
  creditCost: number;
  description: string;
  isActive?: boolean;
}

export interface ServicePricingUpdateRequest {
  serviceName?: string;
  serviceCode?: string;
  creditCost?: number;
  description?: string;
  isActive?: boolean;
}
