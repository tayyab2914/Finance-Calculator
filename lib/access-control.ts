import type { Database } from "@/lib/supabase"

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"]

export interface AccessCheckResult {
  hasAccess: boolean
  reason?: "no_auth" | "trial_expired" | "subscription_expired" | "invalid_status"
  message?: string
}

/**
 * Checks if a user has access based on their subscription status
 * Returns true only if:
 * - User is in trialing status and trial hasn't ended
 * - User is in active status and current period hasn't ended
 */
export function checkSubscriptionAccess(subscription: Subscription | null): AccessCheckResult {
  if (!subscription) {
    return {
      hasAccess: false,
      reason: "invalid_status",
      message: "No subscription found. Please start your free trial.",
    }
  }

  const now = new Date()

  // Check trialing status
  if (subscription.status === "trialing") {
    if (!subscription.trial_end) {
      return {
        hasAccess: false,
        reason: "trial_expired",
        message: "Trial period information is missing.",
      }
    }

    const trialEnd = new Date(subscription.trial_end)
    if (trialEnd <= now) {
      return {
        hasAccess: false,
        reason: "trial_expired",
        message: "Your free trial has expired. Please upgrade to continue.",
      }
    }

    return { hasAccess: true }
  }

  // Check active status
  if (subscription.status === "active") {
    if (!subscription.current_period_end) {
      return {
        hasAccess: false,
        reason: "subscription_expired",
        message: "Subscription period information is missing.",
      }
    }

    const periodEnd = new Date(subscription.current_period_end)
    if (periodEnd <= now) {
      return {
        hasAccess: false,
        reason: "subscription_expired",
        message: "Your subscription has expired. Please renew to continue.",
      }
    }

    return { hasAccess: true }
  }

  // All other statuses (past_due, canceled, etc.) deny access
  return {
    hasAccess: false,
    reason: "invalid_status",
    message: `Your subscription is ${subscription.status}. Please update your subscription to continue.`,
  }
}
