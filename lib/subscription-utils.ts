import { supabase } from "@/lib/supabase"
import { getStripeInstance } from "@/lib/stripe"

export async function createTrialSubscription(userId: string) {
  try {
    // Use API endpoint to create trial subscription (bypasses RLS)
    const response = await fetch("/api/auth/create-trial", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create trial subscription")
    }

    const { data } = await response.json()
    return data
  } catch (error) {
    console.error("Error creating trial subscription:", error)
    throw error
  }
}

export async function checkSubscriptionAccess(userId: string): Promise<boolean> {
  try {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, trial_end, current_period_end")
      .eq("user_id", userId)
      .single()

    if (!subscription) return false

    const now = new Date()

    // Check if user is in trial period
    if (subscription.status === "trialing" && subscription.trial_end) {
      return new Date(subscription.trial_end) > now
    }

    // Check if user has active subscription
    if (subscription.status === "active" && subscription.current_period_end) {
      return new Date(subscription.current_period_end) > now
    }

    return false
  } catch (error) {
    console.error("Error checking subscription access:", error)
    return false
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const stripe = getStripeInstance()
    // Cancel the subscription at period end in Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    // Update local database
    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId)

    return subscription
  } catch (error) {
    console.error("Error canceling subscription:", error)
    throw error
  }
}

export async function reactivateSubscription(subscriptionId: string) {
  try {
    const stripe = getStripeInstance()
    // Reactivate the subscription in Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    // Update local database
    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId)

    return subscription
  } catch (error) {
    console.error("Error reactivating subscription:", error)
    throw error
  }
}

export async function createTrialForExistingUsers() {
  try {
    // Find users without subscriptions
    const { data: usersWithoutSubscriptions, error: usersError } = await supabase
      .from("profiles")
      .select("id")
      .not("id", "in", `(SELECT user_id FROM subscriptions)`)

    if (usersError) throw usersError

    if (!usersWithoutSubscriptions || usersWithoutSubscriptions.length === 0) {
      console.log("No existing users found without subscriptions")
      return { created: 0 }
    }

    // Create trial subscriptions for these users
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14) // 14 days from now

    const subscriptionsToCreate = usersWithoutSubscriptions.map((user) => ({
      user_id: user.id,
      status: "trialing",
      trial_end: trialEndDate.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndDate.toISOString(),
    }))

    const { data, error } = await supabase.from("subscriptions").insert(subscriptionsToCreate).select()

    if (error) throw error

    console.log(`Created ${data.length} trial subscriptions for existing users`)
    return { created: data.length }
  } catch (error) {
    console.error("Error creating trials for existing users:", error)
    throw error
  }
}

export function getSubscriptionStatusMessage(
  status: string,
  trialDaysLeft: number,
  trialEndsAt: Date | null,
): { message: string; variant: "default" | "warning" | "destructive" } {
  switch (status) {
    case "trialing":
      if (trialDaysLeft > 3) {
        return {
          message: `Free trial - ${trialDaysLeft} days remaining`,
          variant: "default",
        }
      } else if (trialDaysLeft > 0) {
        return {
          message: `Trial expires in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"}`,
          variant: "warning",
        }
      } else {
        return {
          message: "Trial expired - Subscribe to continue",
          variant: "destructive",
        }
      }
    case "active":
      return {
        message: "Active subscription",
        variant: "default",
      }
    case "past_due":
      return {
        message: "Payment overdue - Update payment method",
        variant: "destructive",
      }
    case "canceled":
      return {
        message: "Subscription canceled",
        variant: "destructive",
      }
    default:
      return {
        message: "No active subscription",
        variant: "destructive",
      }
  }
}
