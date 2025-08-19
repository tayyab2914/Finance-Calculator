"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClientDetailsForm } from "@/components/client-details-form"
import { EquipmentForm } from "@/components/equipment-form"
import { AnalysisResults } from "@/components/analysis-results"
import { Plus } from "lucide-react"

export interface ClientDetails {
  companyName: string
  email: string
  referenceNumber: string
}

export interface Equipment {
  id: string
  brand: string
  model: string
  serialNumber?: string
  location: string
  type: "color" | "black"
  ownership: "lease" | "owned" | "cash"
  copyBasedService: boolean
  termRemaining?: number
  leaseDetails?: {
    monthlyAmount: number
    annualEscalation: number
    monthsRemaining: number
    paymentFrequency: "monthly" | "quarterly"
    evergreenRental: boolean
    reducedRate?: number
  }
  clickCharges?: {
    black: {
      rate: number
      monthlyVolume: number
      growthPercent: number
      escalationPercent: number
    }
    color?: {
      rate: number
      monthlyVolume: number
      growthPercent: number
      escalationPercent: number
    }
  }
  tonerCosts?: {
    blackMonthlyVolume: number
    colorMonthlyVolume?: number
    blackCostPerCartridge: number
    colorCostPerCartridge?: number
    numberOfColorCartridges?: number
    blackYieldPerUnit: number
    colorYieldPerUnit?: number
    blackVolumeGrowthPercent?: number
    colorVolumeGrowthPercent?: number
    blackCostEscalationPercent?: number
    colorCostEscalationPercent?: number
    escalationPercent?: number // Keep for backward compatibility
  }
  otherCosts?: Array<{
    category: string
    monthlyAmount: number
    escalationPercent: number
  }>
  // Proposed equipment specific fields
  cashPrice?: number | string
  settlement?: number | string
  sellingPrice?: number
  rentalFactor?: number | string
  advanceOrArrears?: "advance" | "arrears"
  fmvLease?: boolean
  leasePeriod?: number
  savingsPerMonth?: number | string
}

export default function UpgradeAnalysisPage() {
  const [step, setStep] = useState(1)
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    companyName: "",
    email: "",
    referenceNumber: "",
  })
  const [currentEquipment, setCurrentEquipment] = useState<Equipment[]>([])
  const [proposedEquipment, setProposedEquipment] = useState<Equipment[]>([])

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

  const updateCurrentEquipment = (id: string, updates: Partial<Equipment>) => {
    setCurrentEquipment((prev) => prev.map((eq) => (eq.id === id ? { ...eq, ...updates } : eq)))
  }

  const updateProposedEquipment = (id: string, updates: Partial<Equipment>) => {
    setProposedEquipment((prev) => prev.map((eq) => (eq.id === id ? { ...eq, ...updates } : eq)))
  }

  const removeCurrentEquipment = (id: string) => {
    setCurrentEquipment((prev) => prev.filter((eq) => eq.id !== id))
  }

  const removeProposedEquipment = (id: string) => {
    setProposedEquipment((prev) => prev.filter((eq) => eq.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upgrade Analysis</h1>
          <p className="text-gray-600">Compare current vs proposed equipment costs and calculate NPV</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-16 h-1 mx-2 ${step > stepNumber ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <div className="text-sm text-gray-600">
              {step === 1 && "Client Details"}
              {step === 2 && "Current Equipment"}
              {step === 3 && "Proposed Equipment"}
              {step === 4 && "Analysis Results"}
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
                <Button onClick={() => setStep(2)} disabled={!clientDetails.companyName || !clientDetails.email}>
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
                <Button onClick={addCurrentEquipment} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Equipment
                </Button>
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
                <Button onClick={addProposedEquipment} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Equipment
                </Button>
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
                Generate Analysis
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
              onNavigateBack={() => setStep(3)}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button onClick={() => setStep(1)}>New Analysis</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
