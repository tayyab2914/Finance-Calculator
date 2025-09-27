import { type NextRequest, NextResponse } from "next/server"
import { submitFeedback } from "@/lib/feedback-utils"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const feedbackData = await request.json()

    const feedback = await submitFeedback(user.id, feedbackData)

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error("Submit feedback error:", error)
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
  }
}
