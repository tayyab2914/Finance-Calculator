import { type NextRequest, NextResponse } from "next/server"
import { getStripeInstance } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"
import { completeReferral, grantReferralReward } from "@/lib/referral-utils-server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// ✅ Safe helper to avoid RangeError
function toISOStringSafe(seconds?: number | null): string | null {
  if (!seconds || isNaN(seconds)) return null
  return new Date(seconds * 1000).toISOString()
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    const stripe = getStripeInstance()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const item = subscription.items.data[0]
  if (!userId) return

  console.log("Subscription created for user:", userId)

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: toISOStringSafe(item?.current_period_start),
      current_period_end: toISOStringSafe(item?.current_period_end),
      trial_end: toISOStringSafe(subscription.trial_end),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }, // ✅ ensures one record per user
  )
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const item = subscription.items.data[0]
  if (!userId) return

  console.log("Subscription updated for user:", userId)

  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: toISOStringSafe(item?.current_period_start),
      current_period_end: toISOStringSafe(item?.current_period_end),
      trial_end: toISOStringSafe(subscription.trial_end),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  console.log("Subscription deleted for user:", userId)

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // ✅ Safely extract subscription ID from new API shape
  const subscriptionId =
    (invoice as any).parent?.subscription_details?.subscription ??
    (invoice.lines.data[0] as any)?.parent?.subscription_item_details?.subscription

  if (!subscriptionId) {
    console.warn("No subscription ID found on invoice:", invoice.id)
    return
  }

  const stripe = getStripeInstance()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.userId
  if (!userId) return

  console.log("Payment succeeded for user:", userId)

  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)

  try {
    // Complete the referral (marks it as completed and links to user)
    await completeReferral(userId)
    console.log("✅ Referral completed for user:", userId)

    // Find the completed referral to grant rewards
    const { data: referral, error } = await supabase
      .from("referrals")
      .select("id")
      .eq("referee_id", userId)
      .eq("status", "completed")
      .single()

    if (!error && referral) {
      // Grant reward to the referrer (extend their subscription by 1 month)
      await grantReferralReward(referral.id)
      console.log("✅ Referral reward granted for referral:", referral.id)
    }
  } catch (referralError) {
    console.error("❌ Referral processing error:", referralError)
    // Don't throw here - payment processing should continue even if referral fails
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // ✅ Safely extract subscription ID from new API shape
  const subscriptionId =
    (invoice as any).parent?.subscription_details?.subscription ??
    (invoice.lines.data[0] as any)?.parent?.subscription_item_details?.subscription

  if (!subscriptionId) {
    console.warn("No subscription ID found on invoice:", invoice.id)
    return
  }

  const stripe = getStripeInstance()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.userId
  if (!userId) return

  console.log("Payment failed for user:", userId)

  await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
}
