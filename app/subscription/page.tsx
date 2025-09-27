"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useSubscription } from "@/hooks/use-subscription"
import { useToast } from "@/hooks/use-toast"
import { Calendar, CreditCard, AlertTriangle, CheckCircle, Clock, Settings } from "lucide-react"
import { getSubscriptionStatusMessage } from "@/lib/subscription-utils"
import { useAuth } from "@/contexts/auth-context"

export default function SubscriptionPage() {
  return (
    <ProtectedRoute>
      <SubscriptionContent />
    </ProtectedRoute>
  )
}

function SubscriptionContent() {
  const { user } = useAuth()
  const {
    subscription,
    isLoading,
    isTrialing,
    isActive,
    isPastDue,
    isCanceled,
    trialDaysLeft,
    trialEndsAt,
    isPayingButInTrial,
  } = useSubscription()
  const { toast } = useToast()
  const router = useRouter()
  const [isCanceling, setIsCanceling] = useState(false)

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return

    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll lose access at the end of your current billing period.",
      )
    ) {
      return
    }

    try {
      setIsCanceling(true)
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel subscription")
      }

      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled. You'll retain access until the end of your billing period.",
      })

      // Refresh the page to update subscription status
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCanceling(false)
    }
  }

  const handleUpgrade = () => {
    router.push("/pricing")
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  const statusMessage = subscription
    ? getSubscriptionStatusMessage(subscription.status, trialDaysLeft, trialEndsAt)
    : { message: "No subscription found", variant: "destructive" as const }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
        <p className="text-gray-600">Manage your Upgrr subscription and billing</p>
      </div>

      {/* Current Status */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isActive && <CheckCircle className="w-5 h-5 text-green-600" />}
                {isTrialing && <Clock className="w-5 h-5 text-blue-600" />}
                {isPastDue && <AlertTriangle className="w-5 h-5 text-red-600" />}
                {isCanceled && <AlertTriangle className="w-5 h-5 text-gray-600" />}
                Current Status
              </CardTitle>
              <CardDescription>Your subscription details and status</CardDescription>
            </div>
            <Badge
              variant={isActive ? "default" : isTrialing ? "secondary" : isPastDue ? "destructive" : "outline"}
              className={
                isActive
                  ? "bg-green-100 text-green-800"
                  : isTrialing
                    ? "bg-blue-100 text-blue-800"
                    : isPastDue
                      ? "bg-red-100 text-red-800"
                      : ""
              }
            >
              {subscription?.status || "No Subscription"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert
            className={
              statusMessage.variant === "destructive"
                ? "border-red-200 bg-red-50"
                : statusMessage.variant === "warning"
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-green-200 bg-green-50"
            }
          >
            <AlertDescription className="text-base">{statusMessage.message}</AlertDescription>
          </Alert>

          {subscription && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {subscription.current_period_start && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Current Period</p>
                    <p className="text-sm text-gray-600">
                      {new Date(subscription.current_period_start).toLocaleDateString()} -{" "}
                      {subscription.current_period_end &&
                        new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {subscription.trial_end && isTrialing && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Trial Ends</p>
                    <p className="text-sm text-gray-600">
                      {new Date(subscription.trial_end).toLocaleDateString()}
                      {trialDaysLeft > 0 && ` (${trialDaysLeft} days left)`}
                    </p>
                  </div>
                </div>
              )}

              {subscription.stripe_customer_id && (
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Customer ID</p>
                    <p className="text-sm text-gray-600 font-mono">{subscription.stripe_customer_id}</p>
                  </div>
                </div>
              )}

              {subscription.cancel_at_period_end && (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cancellation Scheduled</p>
                    <p className="text-sm text-gray-600">
                      Access ends{" "}
                      {subscription.current_period_end &&
                        new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Upgrade/Manage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Manage Subscription
            </CardTitle>
            <CardDescription>
              {isPayingButInTrial
                ? "Your subscription is active and will begin billing after your trial ends"
                : isTrialing
                  ? "Upgrade to Pro for unlimited access"
                  : "Manage your subscription settings"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTrialing && !isPayingButInTrial && (
              <Button onClick={handleUpgrade} className="w-full">
                Upgrade to Pro - $29.99/month
              </Button>
            )}

            {isActive && !subscription?.cancel_at_period_end && (
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="w-full"
              >
                {isCanceling ? "Canceling..." : "Cancel Subscription"}
              </Button>
            )}

            {isPayingButInTrial && !subscription?.cancel_at_period_end && (
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="w-full"
              >
                {isCanceling ? "Canceling..." : "Cancel Subscription"}
              </Button>
            )}

            {subscription?.cancel_at_period_end && (
              <Button onClick={handleUpgrade} className="w-full">
                Reactivate Subscription
              </Button>
            )}

            {isPastDue && (
              <Button onClick={handleUpgrade} className="w-full">
                Update Payment Method
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Features */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>What's included in your current plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Included Features:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Unlimited equipment analyses
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Professional reports
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Settlement calculator
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  ROI calculator
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Pro Features:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Priority email support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Advanced analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Custom branding
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Export capabilities
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
