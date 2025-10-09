import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cancelSubscription } from "@/lib/subscription-utils"
import { requireUser } from "@/utils/supabase/auth-helpers"
import { createClient } from "@/utils/supabase/server"



export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const userId  = user?.id

    const supabase = await createClient()
    // ✅ Fetch subscription safely
    const { data: subscription, error, count } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id", { count: "exact" })
      .eq("user_id", userId)
      .maybeSingle()


    // ✅ Handle missing row
    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        {
          error: "No active subscription found",
          supabaseError: error,
          rowCount: count,
        },
        { status: 404 }
      )
    }

    // ✅ Cancel Stripe subscription
    await cancelSubscription(subscription.stripe_subscription_id)
    console.log("✅ Subscription canceled:", subscription.stripe_subscription_id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("❌ Internal server error:", err)
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 })
  }
}
