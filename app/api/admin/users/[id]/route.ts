import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/utils/supabase/auth-helpers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin()
  } catch (err: any) {
    console.error("❌ Internal server error:", err)
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 })
  }

  const supabase = await createClient()


  const userId = params.id


  const { data: profile, error: pErr } = await supabase.from("profiles").select("*").eq("id", userId).single()
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 404 })

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id,title,status,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  const { data: referrals } = await supabase
    .from("referrals")
    .select("id,referrer_id,referee_id,referee_email,status,reward_granted,reward_type,completed_at,created_at")
    .or(`referrer_id.eq.${userId},referee_id.eq.${userId}`)
    .order("created_at", { ascending: false })

  return NextResponse.json({ profile, subscription, analyses: analyses || [], referrals: referrals || [] })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin()
  } catch (err: any) {
    console.error("❌ Internal server error:", err)
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 })
  }

  const supabase = await createClient()

  const userId = params.id
  const body = await request.json()

  const allowed = [
    "email",
    "full_name",
    "company_name",
    "job_title",
    "company_address",
    "company_phone",
    "default_discount_rate",
    "currency_symbol",
    "is_admin",
  ]
  const update: Record<string, any> = {}
  for (const k of allowed) {
    if (k in body) update[k] = body[k]
  }
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabase.from("profiles").update(update).eq("id", userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ profile: data })
}
