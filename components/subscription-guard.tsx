"use client"

import type { ReactNode } from "react"
import { useSubscription } from "@/hooks/use-subscription"
import { SubscriptionStatus } from "@/components/subscription-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

interface SubscriptionGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function SubscriptionGuard({ children, fallback }: SubscriptionGuardProps) {
  const { hasAccess, isLoading } = useSubscription()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking subscription status...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>Your free trial has expired. Please upgrade to continue using Upgrr.</CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionStatus />
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
