// lib/subscription-plans.ts
// ✅ No Stripe imports, no secret keys here.
// ✅ Client-safe.

export const SUBSCRIPTION_PLANS = {
  FREE_TRIAL: {
    name: "Free Trial",
    description: "14-day free trial with full access",
    price: 0,
    trialDays: 14,
    features: [
      "Unlimited equipment analyses",
      "Professional reports",
      "Settlement calculator",
      "ROI calculator",
      "Email support",
    ],
  },
  MONTHLY: {
    name: "Monthly Pro",
    description: "Full access to all features",
    price: 29.99,
    // This is safe because it's public
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || "",
    features: [
      "Unlimited equipment analyses",
      "Professional reports",
      "Settlement calculator",
      "ROI calculator",
      "Priority email support",
      "Advanced analytics",
      "Custom branding",
    ],
  },
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS
