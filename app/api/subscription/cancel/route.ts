import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cancelSubscription } from "@/lib/subscription-utils"

export async function POST(request: NextRequest) {

  const { userId } = await request.json()
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

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