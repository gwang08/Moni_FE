export interface PackagePricingResponse {
  id: number;
  name: string;
  price: number;
  creditAmount: number;
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
  packageId: number;
  txnCode: string;
  amount: number;
  updatedAt: string;
  status: string;
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
}

export interface PackagePricingUpdateRequest {
  name?: string;
  price?: number;
  creditAmount?: number;
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
