import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export const getStripeInstance = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      typescript: true,
    })
  }
  return stripeInstance
}

export const stripe = {
  get instance() {
    return getStripeInstance()
  },
}

export const getStripe = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set")
  }

  return import("stripe").then(({ loadStripe }) => loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!))
}

export const SUBSCRIPTION_PLANS = {
  FREE_TRIAL: {
    name: "Free Trial",
    description: "14-day free trial with full access to all features",
    price: 0,
    trialDays: 14,
  },
  MONTHLY: {
    name: "Monthly Pro",
    description: "Unlimited access to all features",
    price: 29.99,
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || "",
  },
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS
