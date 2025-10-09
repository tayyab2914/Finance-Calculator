import Stripe from "stripe"
import { supabaseServer as supabase } from "./supabase-server"
import { stripe } from "@/lib/stripe"


// Complete a referral when the referee becomes a paying customer
export async function completeReferral(refereeUserId: string): Promise<void> {
  const { data: referee, error: refereeError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", refereeUserId)
    .single()

  if (refereeError || !referee) {
    throw new Error("Referee not found")
  }

  // Find pending referral for this referee
  const { data: referral, error: referralError } = await supabase
    .from("referrals")
    .select("*")
    .eq("referee_email", referee.email)
    .eq("status", "pending")
    .single()

  if (referralError || !referral) {
    console.log("No pending referral found for:", referee.email)
    return
  }

  // Update referral to completed and link to user
  const { error: updateError } = await supabase
    .from("referrals")
    .update({
      referee_id: refereeUserId,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", referral.id)

  if (updateError) {
    throw new Error(`Failed to complete referral: ${updateError.message}`)
  }

  // Update referee profile to track who referred them
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      referred_by: referral.referrer_id,
    })
    .eq("id", refereeUserId)

  if (profileError) {
    console.error("Failed to update referee profile:", profileError)
  }
}



// Grant referral reward (extend subscription by 1 month) to BOTH referrer and referee
export async function grantReferralReward(referralId: string): Promise<void> {
  const { data: referral, error: referralError } = await supabase
    .from("referrals")
    .select("*")
    .eq("id", referralId)
    .eq("status", "completed")
    .eq("reward_granted", false)
    .single()

  if (referralError || !referral) {
    throw new Error("Referral not found or already rewarded")
  }

  // ✅ Helper: extend a user's Stripe subscription by 1 month
  async function extendSubscription(userId: string) {
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (subError || !subscription) {
      throw new Error(`Subscription not found for user ${userId}`)
    }

    const stripeSubId = subscription.stripe_subscription_id
    if (!stripeSubId) {
      throw new Error(`Stripe subscription not found for user ${userId}`)
    }

    // 🕓 Calculate new end date (+1 month)
    const currentEnd = new Date(subscription.current_period_end)
    const newEnd = new Date(currentEnd)
    newEnd.setMonth(currentEnd.getMonth() + 1)

    // ⚙️ Update Stripe subscription: delay next billing by 1 month
    await stripe.instance.subscriptions.update(stripeSubId, {
      billing_cycle_anchor: Math.floor(newEnd.getTime() / 1000) as unknown as Stripe.SubscriptionUpdateParams.BillingCycleAnchor,
      proration_behavior: "none",
    })

    // 🗄️ Update Supabase record to match
    const { error: updateSubError } = await supabase
      .from("subscriptions")
      .update({ current_period_end: newEnd.toISOString() })
      .eq("id", subscription.id)

    if (updateSubError) {
      throw new Error(`Failed to extend subscription for ${userId}: ${updateSubError.message}`)
    }
  }

  // ✅ Extend both referrer and referee
  await extendSubscription(referral.referee_id)
  await extendSubscription(referral.referrer_id)

  // ✅ Mark referral as rewarded
  const { error: updateReferralError } = await supabase
    .from("referrals")
    .update({
      status: "rewarded",
      reward_granted: true,
    })
    .eq("id", referralId)

  if (updateReferralError) {
    throw new Error(`Failed to mark referral as rewarded: ${updateReferralError.message}`)
  }

  // ✅ Increment reward count in profiles
  const referrerProfile = await getUserProfile(referral.referrer_id)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      referral_rewards_earned: (referrerProfile?.referral_rewards_earned || 0) + 1,
    })
    .eq("id", referral.referrer_id)

  if (profileError) {
    console.error("Failed to update referrer reward count:", profileError)
  }
}




// Helper function to get user profile
async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("referral_rewards_earned").eq("id", userId).single()

  if (error) {
    console.error("Failed to get user profile:", error)
    return null
  }

  return data
}
