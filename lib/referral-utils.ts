import { supabase } from "./supabase"

export interface Referral {
  id: string
  referrer_id: string
  referee_id: string | null
  referral_code: string
  referee_email: string | null
  status: "pending" | "completed" | "rewarded"
  reward_granted: boolean
  reward_type: string
  reward_value: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ReferralStats {
  totalReferrals: number
  completedReferrals: number
  pendingReferrals: number
  totalRewardsEarned: number
  recentReferrals: Referral[]
}

// Generate a unique referral link for a user
export async function generateReferralLink(userId: string): Promise<string> {
  const { data: profile, error } = await supabase.from("profiles").select("referral_code").eq("id", userId).single()

  if (error) {
    throw new Error(`Failed to get referral code: ${error.message}`)
  }

  if (!profile?.referral_code) {
    throw new Error("No referral code found for user")
  }

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "https://upgrr.com"

  return `${baseUrl}/auth/signup?ref=${profile.referral_code}`
}

// Get user's referral statistics
export async function getUserReferralStats(userId: string): Promise<ReferralStats> {
  const { data: referrals, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to get referral stats: ${error.message}`)
  }

  const totalReferrals = referrals.length
  const completedReferrals = referrals.filter((r) => r.status === "completed" || r.status === "rewarded").length
  const pendingReferrals = referrals.filter((r) => r.status === "pending").length
  const totalRewardsEarned = referrals.filter((r) => r.reward_granted).length
  const recentReferrals = referrals.slice(0, 5)

  return {
    totalReferrals,
    completedReferrals,
    pendingReferrals,
    totalRewardsEarned,
    recentReferrals,
  }
}

// Get all referrals for a user
export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const { data: referrals, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to get user referrals: ${error.message}`)
  }

  return referrals || []
}


// Check if a referral code is valid
export async function validateReferralCode(referralCode: string): Promise<boolean> {
  const { data, error } = await supabase.from("profiles").select("id").eq("referral_code", referralCode).single()

  return !error && !!data
}
