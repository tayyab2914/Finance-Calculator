"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, Shield, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans"
import { useToast } from "@/hooks/use-toast"

export default function PricingPage() {
  const { user } = useAuth()
  const { subscription, isLoading } = useSubscription()
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/auth/signup")
      return
    }

    if (subscription?.status === "active") {
      toast({
        title: "Already subscribed",
        description: "You already have an active subscription.",
      })
      return
    }

    try {
      setIsProcessing(true)

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: SUBSCRIPTION_PLANS.MONTHLY.priceId,
          userId: user.id,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Redirect to Stripe Checkout
      const stripe = await import("@stripe/stripe-js").then(({ loadStripe }) =>
        loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!),
      )

      if (stripe) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
      toast({
        title: "Payment Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a 14-day free trial, then upgrade for unlimited access
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Trial Plan */}
          <Card className="border-2 border-border hover:border-primary/50 transition-colors">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">{SUBSCRIPTION_PLANS.FREE_TRIAL.name}</CardTitle>
              <CardDescription className="text-base">{SUBSCRIPTION_PLANS.FREE_TRIAL.description}</CardDescription>
              <div className="mt-6">
                <div className="text-4xl font-bold text-foreground">Free</div>
                <div className="text-muted-foreground">for 14 days</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-8 text-center">
                <p className="text-muted-foreground">Full access to all Upgrr features during your trial period</p>
              </div>
              <Button
                className="w-full bg-transparent"
                variant="outline"
                onClick={() => router.push("/auth/signup")}
                disabled={isProcessing}
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Plan */}
          <Card className="border-2 border-primary relative hover:shadow-xl transition-all">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
              Most Popular
            </Badge>
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">{SUBSCRIPTION_PLANS.MONTHLY.name}</CardTitle>
              <CardDescription className="text-base">{SUBSCRIPTION_PLANS.MONTHLY.description}</CardDescription>
              <div className="mt-6">
                <div className="text-4xl font-bold text-foreground">${SUBSCRIPTION_PLANS.MONTHLY.price}</div>
                <div className="text-muted-foreground">per month</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-8 text-center">
                <p className="text-muted-foreground">Unlimited access to all Upgrr features with no time limits</p>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleSubscribe}
                disabled={isProcessing || isLoading}
              >
                {isProcessing ? "Processing..." : "Subscribe Now"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">All Features Included</h2>
            <p className="text-xl text-muted-foreground">Professional equipment financial analysis tools</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Complete Analysis Suite</h3>
              <p className="text-muted-foreground">
                ROI calculator, settlement calculator, upgrade analysis, and professional reporting tools.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Unlimited Usage</h3>
              <p className="text-muted-foreground">
                No limits on analyses, reports, or calculations. Use all features as much as you need.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Professional Support</h3>
              <p className="text-muted-foreground">
                Get help from our team of financial experts and equipment industry professionals.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens during the free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You get full access to all Upgrr features for 14 days. No credit card required to start. After the
                  trial ends, you'll need to subscribe to continue using the platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens after my trial expires?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  After your 14-day trial ends, you'll need to upgrade to a paid subscription to continue accessing any
                  features. Your data will be preserved and available once you subscribe.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards (Visa, MasterCard, American Express) and bank transfers through our
                  secure payment processor, Stripe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
