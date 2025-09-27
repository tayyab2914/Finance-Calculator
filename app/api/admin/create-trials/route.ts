import { type NextRequest, NextResponse } from "next/server"
import { createTrialForExistingUsers } from "@/lib/subscription-utils"

export async function POST(request: NextRequest) {
  try {
    // Simple admin check - in production you'd want proper authentication
    const authHeader = request.headers.get("authorization")
    if (authHeader !== "Bearer admin-secret-key") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await createTrialForExistingUsers()

    return NextResponse.json({
      success: true,
      message: `Created ${result.created} trial subscriptions for existing users`,
      created: result.created,
    })
  } catch (error) {
    console.error("Error creating trials for existing users:", error)
    return NextResponse.json({ error: "Failed to create trials for existing users" }, { status: 500 })
  }
}
