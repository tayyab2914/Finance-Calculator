import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { id, email, fullName, companyName } = await request.json()

    const { error } = await supabaseAdmin.from("profiles").insert({
      id,
      email,
      full_name: fullName,
      company_name: companyName,
      default_discount_rate: 8,
      currency_symbol: "$",
      subscription_status: "trialing",
    })

    if (error) {
      console.error("Profile insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
