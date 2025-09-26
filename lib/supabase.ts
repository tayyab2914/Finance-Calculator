import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          job_title: string | null
          company_address: string | null
          company_phone: string | null
          default_discount_rate: number | null
          currency_symbol: string | null
          subscription_status:
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "unpaid"
            | "incomplete"
            | "incomplete_expired"
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          job_title?: string | null
          company_address?: string | null
          company_phone?: string | null
          default_discount_rate?: number | null
          currency_symbol?: string | null
          subscription_status?:
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "unpaid"
            | "incomplete"
            | "incomplete_expired"
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          job_title?: string | null
          company_address?: string | null
          company_phone?: string | null
          default_discount_rate?: number | null
          currency_symbol?: string | null
          subscription_status?:
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "unpaid"
            | "incomplete"
            | "incomplete_expired"
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired"
          current_period_start: string | null
          current_period_end: string | null
          trial_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired"
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired"
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      analyses: {
        Row: {
          id: string
          user_id: string
          title: string
          client_details: any
          current_equipment: any
          proposed_equipment: any
          analysis_settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          client_details: any
          current_equipment: any
          proposed_equipment: any
          analysis_settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          client_details?: any
          current_equipment?: any
          proposed_equipment?: any
          analysis_settings?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
