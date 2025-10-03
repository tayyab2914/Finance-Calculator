import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function requireAdmin() {
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser()

  if (error || !user) {
    return { ok: false as const, status: 401, reason: "unauthorized" as const, user: null }
  }

  // Check is_admin on their own profile (allowed by RLS)
  const { data: profile, error: profileErr } = await supabaseAuth
    .from("profiles")
    .select("id, is_admin")
    .eq("id", user.id)
    .single()

  if (profileErr || !profile?.is_admin) {
    return { ok: false as const, status: 403, reason: "forbidden" as const, user: null }
  }

  return { ok: true as const, user }
}
