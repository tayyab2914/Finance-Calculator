import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ error: "Subscriptions are not available" }, { status: 410 })
}
