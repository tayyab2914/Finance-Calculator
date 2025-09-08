"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClientDetailsForm } from "@/components/client-details-form"
import { EquipmentForm } from "@/components/equipment-form"
import { AnalysisResults } from "@/components/analysis-results"
import { Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile } from "@/lib/database"

export interface ClientDetails {
  companyName: string
  email: string
  referenceNumber: string
  contactPersonName?: string
  contactCompany?: string
  contactAddress?: string
  contactNumber?: string
}

export interface Equipment {
  id: string
  brand: string
  model: string
  serialNumber?: string
  location: string
  type: "color" | "black"
  ownership: "lease" | "cash"
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
      growthPercent: string
      escalationPercent: number
    }
    color?: {
      rate: number
      monthlyVolume: number
      growthPercent: string
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
    blackVolumeGrowthPercent?: string
    colorVolumeGrowthPercent?: string
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
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [defaultDiscountRate, setDefaultDiscountRate] = useState(8)
  const [currencySymbol, setCurrencySymbol] = useState("$")
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    companyName: "",
    email: "",
    referenceNumber: "",
  })
  const [currentEquipment, setCurrentEquipment] = useState<Equipment[]>([])
  const [proposedEquipment, setProposedEquipment] = useState<Equipment[]>([])
  const [applyGrowthToAll, setApplyGrowthToAll] = useState(false)

  function isEquipmentValid(equipment: Equipment): boolean {
    // Black check
    if (
      (equipment.clickCharges?.black?.monthlyVolume ?? 0) > 0 &&
      (!equipment.clickCharges?.black?.rate || equipment.clickCharges.black.rate <= 0)
    ) {
      return false
    }

    // Color check
    if (
      (equipment.clickCharges?.color?.monthlyVolume ?? 0) > 0 &&
      (!equipment.clickCharges?.color?.rate || equipment.clickCharges.color.rate <= 0)
    ) {
      return false
    }

    return true
  }
  const areAllCurrentEquipmentsValid = currentEquipment.every(isEquipmentValid)
  const areAllProposedEquipmentsValid = proposedEquipment.every(isEquipmentValid)

  // Load user's default discount rate
  useEffect(() => {
    const loadUserDefaults = async () => {
      if (user) {
        try {
          const profile = await getUserProfile()
          setDefaultDiscountRate(profile.default_discount_rate || 8)
          setCurrencySymbol(profile.currency_symbol || "$")
        } catch (error) {
          console.error("Failed to load user profile:", error)
        }
      }
    }
    loadUserDefaults()
  }, [user])

  const syncGrowthPercentages = (firstEquipmentId: string, blackGrowth: string, colorGrowth: string) => {
    if (!applyGrowthToAll) return

    // Update all current equipment (except the first one)
    setCurrentEquipment((prev) =>
      prev.map((eq, index) => {
        if (index === 0 || eq.id === firstEquipmentId) return eq

        const updates: Partial<Equipment> = {}

        // Update click charges growth
        if (eq.clickCharges) {
          updates.clickCharges = {
            ...eq.clickCharges,
            black: {
              ...eq.clickCharges.black,
              growthPercent: blackGrowth,
            },
          }

          if (eq.type === "color" && eq.clickCharges.color) {
            updates.clickCharges.color = {
              ...eq.clickCharges.color,
              growthPercent: colorGrowth,
            }
          }
        }

        // Update toner costs growth
        if (eq.tonerCosts) {
          updates.tonerCosts = {
            ...eq.tonerCosts,
            blackVolumeGrowthPercent: blackGrowth,
          }

          if (eq.type === "color") {
            updates.tonerCosts.colorVolumeGrowthPercent = colorGrowth
          }
        }

        return { ...eq, ...updates }
      }),
    )

    // Update all proposed equipment
    setProposedEquipment((prev) =>
      prev.map((eq) => {
        const updates: Partial<Equipment> = {}

        // Update click charges growth
        if (eq.clickCharges) {
          updates.clickCharges = {
            ...eq.clickCharges,
            black: {
              ...eq.clickCharges.black,
              growthPercent: blackGrowth,
            },
          }

          if (eq.type === "color" && eq.clickCharges.color) {
            updates.clickCharges.color = {
              ...eq.clickCharges.color,
              growthPercent: colorGrowth,
            }
          }
        }

        // Update toner costs growth
        if (eq.tonerCosts) {
          updates.tonerCosts = {
            ...eq.tonerCosts,
            blackVolumeGrowthPercent: blackGrowth,
          }

          if (eq.type === "color") {
            updates.tonerCosts.colorVolumeGrowthPercent = colorGrowth
          }
        }

        return { ...eq, ...updates }
      }),
    )
  }

  const updateCurrentEquipment = (id: string, updates: Partial<Equipment>) => {
    setCurrentEquipment((prev) => {
      const updatedEquipment = prev.map((eq) => (eq.id === id ? { ...eq, ...updates } : eq))

      const equipmentIndex = prev.findIndex((eq) => eq.id === id)
      if (equipmentIndex === 0 && applyGrowthToAll) {
        const updatedEq = updatedEquipment[0]
        const blackGrowth =
          updates.clickCharges?.black?.growthPercent ??
          updates.tonerCosts?.blackVolumeGrowthPercent ??
          updatedEq.clickCharges?.black?.growthPercent ??
          updatedEq.tonerCosts?.blackVolumeGrowthPercent ??
          ""

        const colorGrowth =
          updates.clickCharges?.color?.growthPercent ??
          updates.tonerCosts?.colorVolumeGrowthPercent ??
          updatedEq.clickCharges?.color?.growthPercent ??
          updatedEq.tonerCosts?.colorVolumeGrowthPercent ??
          ""

        // Sync growth percentages if they were updated
        if (
          updates.clickCharges?.black?.growthPercent !== undefined ||
          updates.clickCharges?.color?.growthPercent !== undefined ||
          updates.tonerCosts?.blackVolumeGrowthPercent !== undefined ||
          updates.tonerCosts?.colorVolumeGrowthPercent !== undefined
        ) {
          setTimeout(() => syncGrowthPercentages(id, blackGrowth, colorGrowth), 0)
        }
      }

      return updatedEquipment
    })
  }

  const updateProposedEquipment = (id: string, updates: Partial<Equipment>) => {
    setProposedEquipment((prev) => prev.map((eq) => (eq.id === id ? { ...eq, ...updates } : eq)))
  }

  const addCurrentEquipment = () => {
    const firstEquipment = currentEquipment[0]
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

    // Apply first equipment's growth percentages if sync is enabled
    if (firstEquipment) {
      const blackGrowth =
        firstEquipment.clickCharges?.black?.growthPercent ?? firstEquipment.tonerCosts?.blackVolumeGrowthPercent ?? ""
      const colorGrowth =
        firstEquipment.clickCharges?.color?.growthPercent ?? firstEquipment.tonerCosts?.colorVolumeGrowthPercent ?? ""

      if (newEquipment.copyBasedService) {
        newEquipment.clickCharges = {
          black: { rate: 0, monthlyVolume: 0, growthPercent: blackGrowth, escalationPercent: 0 },
          color: { rate: 0, monthlyVolume: 0, growthPercent: colorGrowth, escalationPercent: 0 },
        }
      } else {
        newEquipment.tonerCosts = {
          blackMonthlyVolume: 0,
          colorMonthlyVolume: 0,
          blackCostPerCartridge: 0,
          colorCostPerCartridge: 0,
          blackYieldPerUnit: 0,
          colorYieldPerUnit: 0,
          blackVolumeGrowthPercent: blackGrowth,
          colorVolumeGrowthPercent: colorGrowth,
          blackCostEscalationPercent: 0,
          colorCostEscalationPercent: 0,
        }
      }
    }

    setCurrentEquipment([...currentEquipment, newEquipment])
  }

  const addProposedEquipment = () => {
    const firstCurrentEquipment = currentEquipment[0]
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

    // Apply first current equipment's growth percentages if sync is enabled
    if (firstCurrentEquipment) {
      const blackGrowth =
        firstCurrentEquipment.clickCharges?.black?.growthPercent ??
        firstCurrentEquipment.tonerCosts?.blackVolumeGrowthPercent ??
        ""
      const colorGrowth =
        firstCurrentEquipment.clickCharges?.color?.growthPercent ??
        firstCurrentEquipment.tonerCosts?.colorVolumeGrowthPercent ??
        ""

      if (newEquipment.copyBasedService) {
        newEquipment.clickCharges = {
          black: { rate: 0, monthlyVolume: 0, growthPercent: blackGrowth, escalationPercent: 0 },
          color: { rate: 0, monthlyVolume: 0, growthPercent: colorGrowth, escalationPercent: 0 },
        }
      } else {
        newEquipment.tonerCosts = {
          blackMonthlyVolume: 0,
          colorMonthlyVolume: 0,
          blackCostPerCartridge: 0,
          colorCostPerCartridge: 0,
          blackYieldPerUnit: 0,
          colorYieldPerUnit: 0,
          blackVolumeGrowthPercent: blackGrowth,
          colorVolumeGrowthPercent: colorGrowth,
          blackCostEscalationPercent: 0,
          colorCostEscalationPercent: 0,
        }
      }
    }

    setProposedEquipment([...proposedEquipment, newEquipment])
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
          <p className="text-gray-600">Compare current vs proposed equipment costs and 
            calculate the total overall projected contracted costs or savings in todays money</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center ">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && <div className={`w-20 h-1 ${step > stepNumber ? "bg-green-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <div className="text-sm text-gray-600">
              {step === 1 && "Equipment User Details"}
              {step === 2 && "Current Equipment"}
              {step === 3 && "Proposed Equipment"}
              {step === 4 && "Analysis Results"}
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Equipment User Details</CardTitle>
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
              <Button
                onClick={() => setStep(3)}
                disabled={currentEquipment.length === 0 || !areAllCurrentEquipmentsValid}
              >
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
                        applyGrowthToAll={applyGrowthToAll}
                        setApplyGrowthToAll={setApplyGrowthToAll}
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
              <Button
                onClick={() => setStep(4)}
                disabled={proposedEquipment.length === 0 || !areAllProposedEquipmentsValid}
              >
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
              initialDiscountRate={defaultDiscountRate}
              currencySymbol={currencySymbol}
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
