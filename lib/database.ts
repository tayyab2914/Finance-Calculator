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

export async function getUserAnalyses(): Promise<SavedAnalysis[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

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

export async function getUserProfile() {
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
