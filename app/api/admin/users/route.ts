import { NextResponse } from "next/server"
import { requireAdmin } from "@/utils/supabase/auth-helpers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0

export async function GET() {

  try {
    const user = await requireAdmin()
  } catch (err: any) {
    console.error("❌ Internal server error:", err)
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 })
  }

  const supabase = await createClient()


  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id, email, full_name, company_name, is_admin, created_at, updated_at
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const users = (data || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.full_name,
    company: u.company_name,
    is_admin: !!u.is_admin,
    created_at: u.created_at,
  }))

  return NextResponse.json({ users })
}
