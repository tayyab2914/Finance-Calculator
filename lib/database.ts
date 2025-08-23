import { supabase } from "./supabase"
import type { ClientDetails, Equipment } from "@/app/upgrade-analysis/page"

export interface SavedAnalysis {
  id: string
  title: string
  client_details: ClientDetails
  current_equipment: Equipment[]
  proposed_equipment: Equipment[]
  analysis_settings: {
    analysisYears: number
    discountRateAnnual: number
  }
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  company_name: string
  job_title?: string
  company_address?: string
  company_phone?: string
  company_logo_url?: string
  default_discount_rate: number
  currency_symbol: string
  created_at: string
  updated_at: string
}

export async function saveAnalysis(
  title: string,
  clientDetails: ClientDetails,
  currentEquipment: Equipment[],
  proposedEquipment: Equipment[],
  analysisSettings: { analysisYears: number; discountRateAnnual: number },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: user.id,
      title,
      client_details: clientDetails,
      current_equipment: currentEquipment,
      proposed_equipment: proposedEquipment,
      analysis_settings: analysisSettings,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save analysis: ${error.message}`)
  }

  return data
}

export async function updateAnalysis(
  analysisId: string,
  title: string,
  clientDetails: ClientDetails,
  currentEquipment: Equipment[],
  proposedEquipment: Equipment[],
  analysisSettings: { analysisYears: number; discountRateAnnual: number },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("analyses")
    .update({
      title,
      client_details: clientDetails,
      current_equipment: currentEquipment,
      proposed_equipment: proposedEquipment,
      analysis_settings: analysisSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update analysis: ${error.message}`)
  }

  return data
}

export async function getUserAnalyses(searchTerm?: string, sortBy?: string): Promise<SavedAnalysis[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  let query = supabase.from("analyses").select("*").eq("user_id", user.id)

  // Add search functionality
  if (searchTerm) {
    query = query.or(
      `title.ilike.%${searchTerm}%,client_details->>companyName.ilike.%${searchTerm}%,client_details->>email.ilike.%${searchTerm}%`,
    )
  }

  // Add sorting
  switch (sortBy) {
    case "title":
      query = query.order("title", { ascending: true })
      break
    case "company":
      query = query.order("client_details->companyName", { ascending: true })
      break
    case "created":
      query = query.order("created_at", { ascending: false })
      break
    default:
      query = query.order("updated_at", { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch analyses: ${error.message}`)
  }

  return data || []
}

export async function getAnalysisById(analysisId: string): Promise<SavedAnalysis | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // Analysis not found
    }
    throw new Error(`Failed to fetch analysis: ${error.message}`)
  }

  return data
}

export async function deleteAnalysis(analysisId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase.from("analyses").delete().eq("id", analysisId).eq("user_id", user.id)

  if (error) {
    throw new Error(`Failed to delete analysis: ${error.message}`)
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }

  return data
}

export async function uploadCompanyLogo(file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `${user.id}/logo.${fileExt}`

  const { error: uploadError } = await supabase.storage.from("company-logos").upload(fileName, file, { upsert: true })

  if (uploadError) {
    throw new Error(`Failed to upload logo: ${uploadError.message}`)
  }

  const { data } = supabase.storage.from("company-logos").getPublicUrl(fileName)

  // Update profile with logo URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ company_logo_url: data.publicUrl })
    .eq("id", user.id)

  if (updateError) {
    throw new Error(`Failed to update profile with logo: ${updateError.message}`)
  }

  return data.publicUrl
}
