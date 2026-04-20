export interface SubscriptionPlanResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  priceVnd: number;
  durationDays: number;
  quotaAi: number; // -1 = unlimited
  quotaExpert: number;
  isActive: boolean;
}

/** Request body for admin create/update subscription plan. */
export interface SubscriptionPlanUpsertRequest {
  code?: string;
  name?: string;
  description?: string;
  priceVnd?: number;
  durationDays?: number;
  /** -1 = unlimited */
  quotaAi?: number;
  quotaExpert?: number;
  isActive?: boolean;
}

export interface UserSubscriptionResponse {
  id: number;
  planId: number;
  planCode: string;
  planName: string;
  startAt: string;
  endAt: string;
  remainAi: number;
  remainExpert: number;
  usedAi: number;
  usedExpert: number;
  isActive: boolean;
}
