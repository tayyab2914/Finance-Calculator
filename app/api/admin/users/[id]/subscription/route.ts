import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { createClient } from "@supabase/supabase-js"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })
  const userId = params.id
  const body = await request.json()

  const allowed = ["status", "trial_end", "current_period_start", "current_period_end", "cancel_at_period_end"]
  const update: Record<string, any> = {}
  for (const k of allowed) {
    if (k in body) update[k] = body[k]
  }
  update.updated_at = new Date().toISOString()

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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
