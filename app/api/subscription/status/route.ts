import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      { cookies: { get(name) { return cookieStore.get(name)?.value } } }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get subscription status
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    // If no subscription exists, create a trial
    if (!subscription) {
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 14)

      const { data: newSubscription, error: createError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          status: "trialing",
          trial_end: trialEndDate.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndDate.toISOString(),
        })
        .select()
        .single()

      if (createError) throw createError

      return NextResponse.json({ subscription: newSubscription })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Error fetching subscription status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
