"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { useRouter } from "next/navigation"
import { Loader2, Lock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { checkSubscriptionAccess } from "@/lib/access-control"

interface AccessGuardProps {
  children: React.ReactNode
}

export function AccessGuard({ children }: AccessGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const { subscription, isLoading: subscriptionLoading } = useSubscription()
  const router = useRouter()

  // Show loading state while checking authentication and subscription
  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Check 1: User must be authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Authentication Required</CardTitle>
            <CardDescription>You need to be signed in to access this page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/login" className="w-full">
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/auth/signup" className="w-full">
              <Button variant="outline" className="w-full bg-transparent">
                Create Account
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="ghost" className="w-full">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check 2: User must have valid subscription access
  const accessCheck = checkSubscriptionAccess(subscription)

  if (!accessCheck.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Subscription Required</CardTitle>
            <CardDescription>{accessCheck.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-800">
                  {subscription.status === "trialing" && subscription.trial_end && (
                    <>
                      Your trial ended on {new Date(subscription.trial_end).toLocaleDateString()}. Upgrade now to
                      continue using Upgrr.
                    </>
                  )}
                  {subscription.status === "active" && subscription.current_period_end && (
                    <>
                      Your subscription ended on {new Date(subscription.current_period_end).toLocaleDateString()}.
                      Please renew to continue.
                    </>
                  )}
                  {subscription.status === "past_due" && (
                    <>Your payment is past due. Please update your payment method to restore access.</>
                  )}
                  {subscription.status === "canceled" && (
                    <>Your subscription was canceled. Subscribe again to regain access.</>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Link href="/pricing" className="w-full">
              <Button className="w-full">{subscription?.status === "trialing" ? "Upgrade Now" : "View Pricing"}</Button>
            </Link>

            {subscription?.status === "past_due" && (
              <Link href="/subscription" className="w-full">
                <Button variant="outline" className="w-full bg-transparent">
                  Update Payment Method
                </Button>
              </Link>
            )}

            <Link href="/dashboard" className="w-full">
              <Button variant="ghost" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User has valid access - render the protected content
  return <>{children}</>
}
