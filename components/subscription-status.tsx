"use client"

import { AlertCircle, CheckCircle, Clock, CreditCard } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSubscription } from "@/hooks/use-subscription"
import { getSubscriptionStatusMessage } from "@/lib/subscription-utils"
import { useRouter } from "next/navigation"

interface SubscriptionStatusProps {
  showUpgradeButton?: boolean
  compact?: boolean
}

export function SubscriptionStatus({ showUpgradeButton = true, compact = false }: SubscriptionStatusProps) {
  const { subscription, isLoading, isTrialing, isActive, isPastDue, trialDaysLeft, trialEndsAt, isPayingButInTrial } =
    useSubscription()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading subscription...</span>
      </div>
    )
  }

  if (!subscription) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No subscription found. Start your free trial to access all features.
          {showUpgradeButton && (
            <Button variant="outline" size="sm" className="ml-2 bg-transparent" onClick={() => router.push("/pricing")}>
              Start Trial
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  const statusMessage = getSubscriptionStatusMessage(subscription.status, trialDaysLeft, trialEndsAt)

  const getStatusIcon = () => {
    if (isActive) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (isTrialing) return <Clock className="w-4 h-4 text-blue-600" />
    if (isPastDue) return <CreditCard className="w-4 h-4 text-red-600" />
    return <AlertCircle className="w-4 h-4 text-yellow-600" />
  }

  const getStatusBadge = () => {
    if (isActive)
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Active
        </Badge>
      )
    if (isTrialing)
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          Trial
        </Badge>
      )
    if (isPastDue) return <Badge variant="destructive">Past Due</Badge>
    return <Badge variant="secondary">Inactive</Badge>
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        {getStatusBadge()}
        <span className="text-sm text-muted-foreground">{statusMessage.message}</span>
      </div>
    )
  }

  return (
    <Alert
      className={
        statusMessage.variant === "destructive"
          ? "border-red-200 bg-red-50"
          : statusMessage.variant === "warning"
            ? "border-yellow-200 bg-yellow-50"
            : ""
      }
    >
      {getStatusIcon()}
      <AlertDescription className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {getStatusBadge()}
            <span className="font-medium">{statusMessage.message}</span>
          </div>
          {isTrialing && trialEndsAt && (
            <div className="text-sm text-muted-foreground">
              {isPayingButInTrial
                ? `Trial ends ${trialEndsAt.toLocaleDateString()}, then monthly billing begins`
                : `Trial ends on ${trialEndsAt.toLocaleDateString()}`}
            </div>
          )}
          {isActive && subscription.current_period_end && (
            <div className="text-sm text-muted-foreground">
              Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
            </div>
          )}
        </div>
        {showUpgradeButton && (isTrialing || isPastDue || !isActive) && !isPayingButInTrial && (
          <Button
            variant={statusMessage.variant === "destructive" ? "default" : "outline"}
            size="sm"
            onClick={() => router.push("/pricing")}
          >
            {isTrialing ? "Upgrade Now" : "Subscribe"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
