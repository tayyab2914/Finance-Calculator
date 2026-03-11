"use client"

import { Zap, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">Upgrr — Free Access</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Full access to all features — no subscription required.
          </p>
          <div className="mt-8">
            {user ? (
              <Button size="lg" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <Button size="lg" onClick={() => router.push("/auth/signup")}>
                Get Started Free
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-12">
          <Card>
            <CardContent className="pt-8 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Complete Analysis Suite</h3>
              <p className="text-muted-foreground">
                ROI calculator, settlement calculator, upgrade analysis, and professional reporting tools.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-8 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Unlimited Usage</h3>
              <p className="text-muted-foreground">
                No limits on analyses, reports, or calculations. Use all features as much as you need.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-8 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Professional Support</h3>
              <p className="text-muted-foreground">
                Get help from our team of financial experts and equipment industry professionals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
