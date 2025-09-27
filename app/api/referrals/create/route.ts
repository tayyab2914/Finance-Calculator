import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase with service role key (server only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { referralCode, refereeEmail } = body

    if (!referralCode || !refereeEmail) {
      return NextResponse.json({ error: "Missing referralCode or refereeEmail" }, { status: 400 })
    }

    // Find the referrer by referral code
    const { data: referrer, error: referrerError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("referral_code", referralCode)
      .single()

    if (referrerError || !referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 })
    }

    // Create referral record
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrer.id,
        referee_email: refereeEmail,
        referral_code: referralCode,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (referralError) {
      return NextResponse.json({ error: referralError.message }, { status: 500 })
    }

    return NextResponse.json({ referral })
  } catch (err: any) {
    console.error("❌ create-referral API error:", err)
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 })
  }
}
