import { supabase } from "./supabase"

export interface Feedback {
  id: string
  user_id: string
  analysis_id: string | null
  feedback_type: "general" | "feature_request" | "bug_report" | "user_experience" | "analysis_specific"
  rating: number | null
  title: string | null
  message: string
  category: string | null
  status: "new" | "reviewed" | "in_progress" | "resolved" | "closed"
  admin_response: string | null
  admin_responded_at: string | null
  admin_responded_by: string | null
  created_at: string
  updated_at: string
}

export interface FeedbackStats {
  totalFeedback: number
  averageRating: number
  feedbackByType: Record<string, number>
  recentFeedback: Feedback[]
}

// Submit new feedback
export async function submitFeedback(
  userId: string,
  feedbackData: {
    feedback_type: Feedback["feedback_type"]
    rating?: number
    title?: string
    message: string
    category?: string
    analysis_id?: string
  },
): Promise<Feedback> {
  const { data: feedback, error } = await supabase
    .from("feedback")
    .insert({
      user_id: userId,
      ...feedbackData,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to submit feedback: ${error.message}`)
  }

  return feedback
}

// Get user's feedback history
export async function getUserFeedback(userId: string): Promise<Feedback[]> {
  const { data: feedback, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to get user feedback: ${error.message}`)
  }

  return feedback || []
}

// Get feedback for a specific analysis
export async function getAnalysisFeedback(analysisId: string, userId: string): Promise<Feedback[]> {
  const { data: feedback, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("analysis_id", analysisId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to get analysis feedback: ${error.message}`)
  }

  return feedback || []
}

// Update feedback status (for admin use)
export async function updateFeedbackStatus(
  feedbackId: string,
  status: Feedback["status"],
  adminResponse?: string,
  adminUserId?: string,
): Promise<void> {
  const updateData: any = { status }

  if (adminResponse) {
    updateData.admin_response = adminResponse
    updateData.admin_responded_at = new Date().toISOString()
    updateData.admin_responded_by = adminUserId
  }

  const { error } = await supabase.from("feedback").update(updateData).eq("id", feedbackId)

  if (error) {
    throw new Error(`Failed to update feedback status: ${error.message}`)
  }
}

// Get feedback statistics for a user
export async function getUserFeedbackStats(userId: string): Promise<FeedbackStats> {
  const { data: feedback, error } = await supabase.from("feedback").select("*").eq("user_id", userId)

  if (error) {
    throw new Error(`Failed to get feedback stats: ${error.message}`)
  }

  const totalFeedback = feedback.length
  const ratingsOnly = feedback.filter((f) => f.rating !== null).map((f) => f.rating!)
  const averageRating =
    ratingsOnly.length > 0 ? ratingsOnly.reduce((sum, rating) => sum + rating, 0) / ratingsOnly.length : 0

  const feedbackByType = feedback.reduce(
    (acc, f) => {
      acc[f.feedback_type] = (acc[f.feedback_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const recentFeedback = feedback
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return {
    totalFeedback,
    averageRating,
    feedbackByType,
    recentFeedback,
  }
}
