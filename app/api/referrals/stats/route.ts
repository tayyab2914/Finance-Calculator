import { type NextRequest, NextResponse } from "next/server"
import { getUserReferralStats } from "@/lib/referral-utils"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stats = await getUserReferralStats(user.id)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Get referral stats error:", error)
    return NextResponse.json({ error: "Failed to get referral stats" }, { status: 500 })
  }
}
