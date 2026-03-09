import { NextResponse } from "next/server"
import { createClient } from "./server"

export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized")
  }

  return user
}


export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized")
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, is_admin")
    .eq("id", user.id)
    .single()

  if (profileErr || !profile?.is_admin) {
    throw new Error("forbidden")
  }

  return user
}
