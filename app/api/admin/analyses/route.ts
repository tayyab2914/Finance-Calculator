import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic";
export const revalidate = 0

export async function GET() {
  // const auth = await requireAdmin()
  // if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: analyses, error: analysesError } = await supabase
    .from("analyses")
    .select("id, title, status, created_at, updated_at, user_id, client_details")
    .order("updated_at", { ascending: false })

  console.log(analyses)

  if (analysesError) {
    return NextResponse.json({ error: analysesError.message }, { status: 500 })
  }

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name, company_name")

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  // Create a map of profiles by user_id for quick lookup
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

  // Combine analyses with user information
  const analysesWithUsers =
    analyses?.map((analysis) => {
      const profile = profileMap.get(analysis.user_id)
      const clientCompany = analysis.client_details?.companyName || "N/A"

      return {
        id: analysis.id,
        title: analysis.title,
        status: analysis.status,
        created_at: analysis.created_at,
        updated_at: analysis.updated_at,
        user_id: analysis.user_id,
        user_email: profile?.email || "Unknown",
        user_name: profile?.full_name || "Unknown",
        user_company: profile?.company_name || "N/A",
        client_company: clientCompany,
      }
    }) || []

  // Calculate statistics
  const total = analysesWithUsers.length
  const statusCounts = {
    New: 0,
    Sent: 0,
    Approved: 0,
    Lost: 0,
  }

  analysesWithUsers.forEach((analysis) => {
    if (analysis.status in statusCounts) {
      statusCounts[analysis.status as keyof typeof statusCounts]++
    }
  })

  const wonPercentage = total > 0 ? ((statusCounts.Approved / total) * 100).toFixed(1) : "0.0"
  const lostPercentage = total > 0 ? ((statusCounts.Lost / total) * 100).toFixed(1) : "0.0"

  // Calculate analyses per period (last 30 days, last 7 days, today)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last7Days = new Date(today)
  last7Days.setDate(last7Days.getDate() - 7)
  const last30Days = new Date(today)
  last30Days.setDate(last30Days.getDate() - 30)

  let todayCount = 0
  let last7DaysCount = 0
  let last30DaysCount = 0

  analysesWithUsers.forEach((analysis) => {
    const createdAt = new Date(analysis.created_at)
    if (createdAt >= today) todayCount++
    if (createdAt >= last7Days) last7DaysCount++
    if (createdAt >= last30Days) last30DaysCount++
  })

  return NextResponse.json({
    analyses: analysesWithUsers,
    stats: {
      total,
      statusCounts,
      wonPercentage,
      lostPercentage,
      periods: {
        today: todayCount,
        last7Days: last7DaysCount,
        last30Days: last30DaysCount,
      },
    },
  })
}
