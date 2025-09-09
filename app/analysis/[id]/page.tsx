"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ClientDetailsForm } from "@/components/client-details-form"
import { EquipmentForm } from "@/components/equipment-form"
import { AnalysisResults } from "@/components/analysis-results"
import { getAnalysisById, type SavedAnalysis } from "@/lib/database"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile } from "@/lib/database"
import type { ClientDetails, Equipment } from "@/app/upgrade-analysis/page"

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
  const [currencySymbol, setCurrencySymbol] = useState("$")
  const [step, setStep] = useState(4)

  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    companyName: "",
    email: "",
    referenceNumber: "",
  })
  const [currentEquipment, setCurrentEquipment] = useState<Equipment[]>([])
  const [proposedEquipment, setProposedEquipment] = useState<Equipment[]>([])
  const [applyGrowthToAll, setApplyGrowthToAll] = useState(false)

  useEffect(() => {
    loadAnalysis()
    loadUserDefaults()
  }, [params.id])

  const loadUserDefaults = async () => {
    if (user) {
      try {
        const profile = await getUserProfile()
        setCurrencySymbol(profile.currency_symbol || "$")
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
      setClientDetails(data.client_details)
      setCurrentEquipment(data.current_equipment)
      setProposedEquipment(data.proposed_equipment)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load analysis")
    } finally {
      setLoading(false)
    }
  }

  const updateCurrentEquipment = (id: string, updates: Partial<Equipment>) => {
    setCurrentEquipment((prev) => prev.map((eq) => (eq.id === id ? { ...eq, ...updates } : eq)))
  }

  const updateProposedEquipment = (id: string, updates: Partial<Equipment>) => {
    setProposedEquipment((prev) => prev.map((eq) => (eq.id === id ? { ...eq, ...updates } : eq)))
  }

  const addCurrentEquipment = () => {
    const newEquipment: Equipment = {
      id: Date.now().toString(),
      brand: "",
      model: "",
      location: "",
      type: "color",
      ownership: "lease",
      copyBasedService: true,
      leaseDetails: {
        monthlyAmount: 0,
        annualEscalation: 0,
        monthsRemaining: 0,
        paymentFrequency: "monthly",
        evergreenRental: false,
      },
    }
    setCurrentEquipment([...currentEquipment, newEquipment])
  }

  const addProposedEquipment = () => {
    const newEquipment: Equipment = {
      id: Date.now().toString(),
      brand: "",
      model: "",
      location: "",
      type: "color",
      ownership: "lease",
      copyBasedService: true,
      leaseDetails: {
        monthlyAmount: 0,
        annualEscalation: 0,
        monthsRemaining: 0,
        paymentFrequency: "monthly",
        evergreenRental: false,
      },
    }
    setProposedEquipment([...proposedEquipment, newEquipment])
  }

  const removeCurrentEquipment = (id: string) => {
    setCurrentEquipment((prev) => prev.filter((eq) => eq.id !== id))
  }

  const removeProposedEquipment = (id: string) => {
    setProposedEquipment((prev) => prev.filter((eq) => eq.id !== id))
  }

  const stepInfo = [
    { number: 1, label: "Client", description: "Client Details" },
    { number: 2, label: "Current", description: "Current Equipment" },
    { number: 3, label: "Proposed", description: "Proposed Equipment" },
    { number: 4, label: "Analysis", description: "Analysis Results" },
  ]

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
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

        <div className="mb-8">
          <div className="flex items-center justify-center overflow-x-auto pb-2">
            <div className="flex items-center min-w-max px-4">
              {stepInfo.map((stepItem, index) => (
                <div key={stepItem.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors ${
                        step >= stepItem.number ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                      }`}
                      onClick={() => setStep(stepItem.number)}
                    >
                      {stepItem.number}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 text-center whitespace-nowrap">{stepItem.label}</div>
                  </div>
                  {index < stepInfo.length - 1 && (
                    <div
                      className={`w-16 sm:w-20 h-1 mx-2 ${step > stepItem.number ? "bg-green-600" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <div className="text-sm font-medium text-gray-700">
              {stepInfo.find((s) => s.number === step)?.description}
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientDetailsForm details={clientDetails} onChange={setClientDetails} />
              <div className="flex justify-end mt-6">
                <Button onClick={() => setStep(2)} disabled={!clientDetails.companyName}>
                  Next: Current Equipment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Current Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                {currentEquipment.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No equipment added yet. Click "Add Equipment" to get started.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {currentEquipment.map((equipment, index) => (
                      <EquipmentForm
                        key={equipment.id}
                        equipment={equipment}
                        index={index}
                        type="current"
                        applyGrowthToAll={applyGrowthToAll}
                        setApplyGrowthToAll={setApplyGrowthToAll}
                        onChange={(updates) => updateCurrentEquipment(equipment.id, updates)}
                        onRemove={() => removeCurrentEquipment(equipment.id)}
                        allCurrentEquipment={currentEquipment}
                        allProposedEquipment={proposedEquipment}
                      />
                    ))}
                  </div>
                )}
                <Button onClick={addCurrentEquipment} size="sm" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Equipment
                </Button>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={currentEquipment.length === 0}>
                Next: Proposed Equipment
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Proposed Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                {proposedEquipment.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No equipment added yet. Click "Add Equipment" to get started.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {proposedEquipment.map((equipment, index) => (
                      <EquipmentForm
                        key={equipment.id}
                        equipment={equipment}
                        index={index}
                        type="proposed"
                        applyGrowthToAll={applyGrowthToAll}
                        setApplyGrowthToAll={setApplyGrowthToAll}
                        onChange={(updates) => updateProposedEquipment(equipment.id, updates)}
                        onRemove={() => removeProposedEquipment(equipment.id)}
                        allCurrentEquipment={currentEquipment}
                        allProposedEquipment={proposedEquipment}
                      />
                    ))}
                  </div>
                )}
                <Button onClick={addProposedEquipment} size="sm" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Equipment
                </Button>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={proposedEquipment.length === 0}>
                View Analysis Results
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <AnalysisResults
              clientDetails={clientDetails}
              currentEquipment={currentEquipment}
              proposedEquipment={proposedEquipment}
              savedAnalysisTitle={analysis.title}
              initialAnalysisYears={analysis.analysis_settings.analysisYears}
              initialDiscountRate={analysis.analysis_settings.discountRateAnnual}
              readOnly={false}
              analysisId={analysis.id}
              currencySymbol={currencySymbol}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
