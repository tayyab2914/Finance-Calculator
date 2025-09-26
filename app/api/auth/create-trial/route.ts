import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Create a trial subscription record using server client (bypasses RLS)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14) // 14 days from now

    const { data, error } = await supabaseServer
      .from("subscriptions")
      .insert({
        user_id: userId,
        status: "trialing",
        trial_end: trialEndDate.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndDate.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating trial subscription:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in create-trial API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
