import { supabaseServer as supabase } from "./supabase-server"


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

// Grant referral reward (extend subscription by 1 month)
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

  // Get referrer's current subscription
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", referral.referrer_id)
    .single()

  if (subError || !subscription) {
    throw new Error("Referrer subscription not found")
  }

  // Extend subscription by 1 month
  const currentEndDate = new Date(subscription.current_period_end)
  const newEndDate = new Date(currentEndDate.setMonth(currentEndDate.getMonth() + 1))

  const { error: updateSubError } = await supabase
    .from("subscriptions")
    .update({
      current_period_end: newEndDate.toISOString(),
    })
    .eq("id", subscription.id)

  if (updateSubError) {
    throw new Error(`Failed to extend subscription: ${updateSubError.message}`)
  }

  // Mark referral as rewarded
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

  // Update referrer's reward count
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      referral_rewards_earned: (await getUserProfile(referral.referrer_id))?.referral_rewards_earned + 1 || 1,
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

