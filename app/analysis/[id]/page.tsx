"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AnalysisResults } from "@/components/analysis-results"
import { getAnalysisById, type SavedAnalysis } from "@/lib/database"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile } from "@/lib/database"

export default function AnalysisPage() {
  return (
    <ProtectedRoute>
      <AnalysisContent />
    </ProtectedRoute>
  )
}

function AnalysisContent() {
  const params = useParams()
  const router = useRouter()
  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const [currencySymbol, setCurrencySymbol] = useState('$')

  useEffect(() => {
    loadAnalysis()
    loadUserDefaults()
  }, [params.id])

  const loadUserDefaults = async () => {
    if (user) {
      try {
        const profile = await getUserProfile()
        setCurrencySymbol(profile.currency_symbol || '$')
      } catch (error) {
        console.error("Failed to load user profile:", error)
      }
    }
  }

  const loadAnalysis = async () => {
    try {
      setLoading(true)
      const data = await getAnalysisById(params.id as string)
      if (!data) {
        setError("Analysis not found")
        return
      }
      setAnalysis(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load analysis")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error || "Analysis not found"}</AlertDescription>
        </Alert>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="outline" className="mb-4 bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{analysis.title}</h1>
        <p className="text-gray-600 mt-2">
          Created on{" "}
          {new Date(analysis.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <AnalysisResults
        clientDetails={analysis.client_details}
        currentEquipment={analysis.current_equipment}
        proposedEquipment={analysis.proposed_equipment}
        initialAnalysisYears={analysis.analysis_settings.analysisYears}
        initialDiscountRate={analysis.analysis_settings.discountRateAnnual}
        readOnly={true}
        analysisId={analysis.id}
        currencySymbol={currencySymbol}
      />
    </div>
  )
}
