import { NextResponse } from "next/server"

export async function PATCH() {
  return NextResponse.json({ error: "Subscriptions are not available" }, { status: 410 })
}
