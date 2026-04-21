import { apiClient } from '@/lib/api-client';
import { initPaymentForSubscription } from '@/lib/payment-api';
import type {
  SubscriptionPlanResponse,
  SubscriptionPlanUpsertRequest,
  UserSubscriptionResponse,
  RoadmapSubscriptionStatus,
} from '@/types/subscription.types';
import type { PaymentInitResponse } from '@/types/payment.types';

/** List all active subscription plans. Requires auth (same pattern as /packages, /services). */
export async function listPlans(): Promise<SubscriptionPlanResponse[]> {
  return apiClient.get<SubscriptionPlanResponse[]>('/subscriptions/plans', true);
}

export async function getPlan(id: number): Promise<SubscriptionPlanResponse> {
  return apiClient.get<SubscriptionPlanResponse>(`/subscriptions/plans/${id}`, true);
}

/**
 * Get the current user's active subscription.
 * Returns null when the user has no active subscription.
 */
export async function getMyActiveSubscription(): Promise<UserSubscriptionResponse | null> {
  // Backend returns {} when no sub, or { subscription: {...} } when active
  const raw = await apiClient.get<Record<string, unknown>>('/subscriptions/my/active', true);
  if (raw && typeof raw === 'object' && 'id' in raw) {
    return raw as unknown as UserSubscriptionResponse;
  }
  // Handle both { subscription: {...} } wrapper and empty {}
  if (raw && typeof raw === 'object' && 'subscription' in raw && raw.subscription) {
    return raw.subscription as UserSubscriptionResponse;
  }
  return null;
}

/**
 * Initiate payment to buy a subscription plan.
 * Reuses the existing /payments endpoint with subscriptionPlanId.
 */
export async function buyPlan(planId: number, amount: number): Promise<PaymentInitResponse> {
  return initPaymentForSubscription(planId, amount);
}

/**
 * Check if the user has an active ROADMAP subscription.
 * Used by the dashboard to gate roadmap features.
 */
export async function getRoadmapSubscriptionStatus(): Promise<RoadmapSubscriptionStatus> {
  const raw = await apiClient.get<Record<string, unknown>>('/subscriptions/my/roadmap', true);
  return {
    hasActiveSubscription: raw?.hasActiveSubscription === true,
    subscription: raw?.subscription as UserSubscriptionResponse | undefined,
  };
}

// ---- Admin-only endpoints (requires ROLE_ADMIN) ----

/** List ALL plans including inactive ones. */
export async function adminListSubscriptionPlans(): Promise<SubscriptionPlanResponse[]> {
  return apiClient.get<SubscriptionPlanResponse[]>('/subscriptions/admin/plans', true);
}

export async function adminCreateSubscriptionPlan(
  data: SubscriptionPlanUpsertRequest,
): Promise<SubscriptionPlanResponse> {
  return apiClient.post<SubscriptionPlanResponse>('/subscriptions/admin/plans', data, true);
}

export async function adminUpdateSubscriptionPlan(
  id: number,
  data: SubscriptionPlanUpsertRequest,
): Promise<SubscriptionPlanResponse> {
  return apiClient.put<SubscriptionPlanResponse>(`/subscriptions/admin/plans/${id}`, data, true);
}

/** Soft-delete: sets isActive=false, preserves subscription history. */
export async function adminDeleteSubscriptionPlan(id: number): Promise<void> {
  await apiClient.delete(`/subscriptions/admin/plans/${id}`, true);
}
