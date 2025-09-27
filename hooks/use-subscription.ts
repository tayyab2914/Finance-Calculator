"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"]

export interface SubscriptionStatus {
  subscription: Subscription | null
  isLoading: boolean
  isTrialing: boolean
  isActive: boolean
  isPastDue: boolean
  isCanceled: boolean
  trialDaysLeft: number
  trialEndsAt: Date | null
  hasAccess: boolean
  error: string | null
  isPayingButInTrial: boolean
}

export function useSubscription(): SubscriptionStatus {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setIsLoading(false)
      return
    }

    fetchSubscription()
  }, [user])

  const fetchSubscription = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      setSubscription(data || null)
    } catch (err) {
      console.error("Error fetching subscription:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch subscription")
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate subscription status
  const isTrialing = subscription?.status === "trialing"
  const isActive = subscription?.status === "active"
  const isPastDue = subscription?.status === "past_due"
  const isCanceled = subscription?.status === "canceled"

  // Calculate trial days left
  const trialEndsAt = subscription?.trial_end ? new Date(subscription.trial_end) : null
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const isPayingButInTrial = Boolean(
    subscription?.stripe_subscription_id &&
      subscription?.status === "trialing" &&
      trialEndsAt &&
      trialEndsAt > new Date(),
  )

  // Determine if user has access to features
  const hasAccess = isTrialing || isActive

  return {
    subscription,
    isLoading,
    isTrialing,
    isActive,
    isPastDue,
    isCanceled,
    trialDaysLeft,
    trialEndsAt,
    hasAccess,
    error,
    isPayingButInTrial,
  }
}
