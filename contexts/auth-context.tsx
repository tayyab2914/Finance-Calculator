"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
import { createTrialSubscription } from "@/lib/subscription-utils"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, companyName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profileData: {
    fullName: string
    companyName: string
    jobTitle?: string
    companyAddress?: string
    companyPhone?: string
    defaultDiscountRate?: number
    currencySymbol?: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!loading && user) {
      // Only redirect to dashboard on first login, not on every page load
      if (!hasRedirected.current && (pathname === "/" || pathname === "/auth/login" || pathname === "/auth/signup")) {
        console.log("✅ First login → redirecting /dashboard")
        router.replace("/dashboard")
        hasRedirected.current = true
      }
    } else if (!loading && !user) {
      // Only redirect to home on logout, not when accessing protected routes
      if (hasRedirected.current) {
        console.log("✅ Signed out → redirecting /")
        router.replace("/")
        hasRedirected.current = false
      }
    }
  }, [user, loading, router, pathname])

  useEffect(() => {
    console.log("🔄 Checking initial session...")
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("✅ Initial session:", session)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    console.log("👂 Subscribing to auth state changes...")
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("⚡ Auth state changed:", event, session)

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      console.log("🧹 Unsubscribing from auth listener")
      subscription.unsubscribe()
    }
  }, [router])

  const signUp = async (email: string, password: string, fullName: string, companyName: string) => {
    console.log("📝 Signing up:", email, fullName, companyName)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    })

    if (error) {
      console.error("❌ SignUp error:", error)
      throw error
    }

    if (data.user) {
      console.log("✅ User created:", data.user)

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        company_name: companyName,
        default_discount_rate: 8, // Default 8%
        currency_symbol: "$", // Default USD
        subscription_status: "trialing", // Start with trial
      })

      if (profileError) {
        console.error("❌ Profile creation error:", profileError)
        throw profileError
      }

      try {
        // Wait a moment for the session to be established
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await createTrialSubscription(data.user.id)
        console.log("✅ Trial subscription created for user:", data.user.id)
      } catch (subscriptionError) {
        console.error("❌ Trial subscription creation error:", subscriptionError)
        // Don't throw here - user can still use the app, just log the error
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log("🔑 Signing in:", email)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      console.error("❌ SignIn error:", error)
      throw error
    }
  }

  const signOut = async () => {
    console.log("🚪 Signing out")
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("❌ SignOut error:", error)
      throw error
    }
  }

  const updateProfile = async (profileData: {
    fullName: string
    companyName: string
    jobTitle?: string
    companyAddress?: string
    companyPhone?: string
    defaultDiscountRate?: number
    currencySymbol?: string
  }) => {
    if (!user) throw new Error("No user logged in")
    console.log("✏️ Updating profile for:", user.id)

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileData.fullName,
        company_name: profileData.companyName,
        job_title: profileData.jobTitle,
        company_address: profileData.companyAddress,
        company_phone: profileData.companyPhone,
        default_discount_rate: profileData.defaultDiscountRate,
        currency_symbol: profileData.currencySymbol,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      console.error("❌ Profile update error:", error)
      throw error
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: profileData.fullName,
        company_name: profileData.companyName,
      },
    })

    if (authError) {
      console.error("❌ Auth metadata update error:", authError)
      throw authError
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
