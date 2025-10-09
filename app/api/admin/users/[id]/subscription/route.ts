import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/utils/supabase/auth-helpers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0

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

  const allowed = ["status", "trial_end", "current_period_start", "current_period_end", "cancel_at_period_end"]
  const update: Record<string, any> = {}
  for (const k of allowed) {
    if (k in body) update[k] = body[k]
  }
  update.updated_at = new Date().toISOString()


  // Check existing
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase.from("subscriptions").update(update).eq("id", existing.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ subscription: data })
  }

  // Create new
  const insert = { ...update, user_id: userId, created_at: new Date().toISOString() }
  const { data, error } = await supabase.from("subscriptions").insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ subscription: data })
}
