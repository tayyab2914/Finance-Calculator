import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  // const auth = await requireAdmin()
  // if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id, email, full_name, company_name, is_admin, created_at, updated_at,
      subscription_status, trial_ends_at,
      subscriptions:subscriptions(
        id, status, trial_end, current_period_start, current_period_end, cancel_at_period_end, stripe_subscription_id
      )
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Normalize subscriptions to last item or single
  const users = (data || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.full_name,
    company: u.company_name,
    is_admin: !!u.is_admin,
    subscription_status: u.subscription_status,
    trial_ends_at: u.trial_ends_at,
    subscription: Array.isArray(u.subscriptions) ? (u.subscriptions[0] ?? null) : (u.subscriptions ?? null),
    created_at: u.created_at,
  }))

  return NextResponse.json({ users })
}
