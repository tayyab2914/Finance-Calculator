"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef  } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, companyName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (fullName: string, companyName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!loading && user) {
      if (!hasRedirected.current) {
        console.log("✅ First login → redirecting /dashboard")
        router.replace("/dashboard")
        hasRedirected.current = true
      }
    } else if (!loading && !user) {
      console.log("✅ Signed out → redirecting /")
      router.replace("/")
      hasRedirected.current = false // reset so next login redirects again
    }
  }, [user, loading, router])

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

      // if (event === "SIGNED_IN") {
      //   console.log("➡️ Redirecting to /dashboard")
      //   router.push("/dashboard")
      // } else if (event === "SIGNED_OUT") {
      //   console.log("➡️ Redirecting to /")
      //   router.push("/")
      // }
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
      })

      if (profileError) {
        console.error("❌ Profile creation error:", profileError)

        if (profileError.code === "23503") {
          throw new Error("A user is already registered with this email.")
        }

        if (profileError.code != "23505") {
          throw profileError
        }
                
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

  const updateProfile = async (fullName: string, companyName: string) => {
    if (!user) throw new Error("No user logged in")
    console.log("✏️ Updating profile for:", user.id)

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        company_name: companyName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      console.error("❌ Profile update error:", error)
      throw error
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        company_name: companyName,
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
