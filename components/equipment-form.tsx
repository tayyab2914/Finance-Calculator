"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2, ChevronDown, ChevronRight, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Equipment } from "@/app/upgrade-analysis/page"
import { useEffect, useState } from "react"
import { calculateUnifiedVolumeTotals } from "@/lib/equipment-calculations"

interface EquipmentFormProps {
  equipment: Equipment
  index: number
  type: "current" | "proposed"
  applyGrowthToAll: boolean
  setApplyGrowthToAll: React.Dispatch<React.SetStateAction<boolean>>
  onChange: (updates: Partial<Equipment>) => void
  onRemove: () => void
  allCurrentEquipment?: Equipment[]
  allProposedEquipment?: Equipment[]
}

export function EquipmentForm({
  equipment,
  index,
  type,
  onChange,
  onRemove,
  applyGrowthToAll,
  setApplyGrowthToAll,
  allCurrentEquipment = [],
  allProposedEquipment = [],
}: EquipmentFormProps) {
  const [sellingPrice, setSellingPrice] = useState<number>(equipment.sellingPrice || 0)
  const [rentalAmount, setRentalAmount] = useState<number>(0)
  const [showLeaseCalculation, setShowLeaseCalculation] = useState(false)


  useEffect(() => {
    if (equipment.cashPrice !== undefined && equipment.settlement !== undefined) {
      const newSellingPrice = Number(equipment.cashPrice) + Number(equipment.settlement)
      setSellingPrice(newSellingPrice)
      onChange({ sellingPrice: newSellingPrice })
    } else {
      setSellingPrice(0)
    }
  }, [equipment.cashPrice, equipment.settlement])

  useEffect(() => {
    if (
      equipment.rentalFactor !== undefined &&
      equipment.cashPrice !== undefined &&
      equipment.settlement !== undefined
    ) {
      const newRentalAmount =
        (Number(equipment.cashPrice) + Number(equipment.settlement)) * Number(equipment.rentalFactor)
      setRentalAmount(newRentalAmount)
      // Update the lease details with calculated rental amount
      updateLeaseDetails("monthlyAmount", newRentalAmount)
    } else {
      setRentalAmount(0)
    }
  }, [equipment.rentalFactor, equipment.cashPrice, equipment.settlement])

  const updateLeaseDetails = (field: string, value: any) => {
    onChange({
      leaseDetails: {
        ...equipment.leaseDetails,
        [field]: value,
      } as any,
    })
  }

  const updateClickCharges = (colorType: "black" | "color", field: string, value: any) => {
    onChange({
      clickCharges: {
        ...equipment.clickCharges,
        [colorType]: {
          ...equipment.clickCharges?.[colorType],
          [field]: value,
        },
      } as any,
    })
  }

  const updateTonerCosts = (field: string, value: any) => {
    onChange({
      tonerCosts: {
        ...equipment.tonerCosts,
        [field]: value,
      } as any,
    })
  }

  // Update unified volume settings - sync between click charges and toner costs
  const updateUnifiedVolume = (colorType: "black" | "color", field: "volume" | "growth", value: any) => {
    const updates: Partial<Equipment> = {}

    if (field === "volume") {
      // Update both click charges and toner costs volume
      if (colorType === "black") {
        updates.clickCharges = {
          ...equipment.clickCharges,
          black: {
            ...equipment.clickCharges?.black,
            monthlyVolume: value,
          },
        } as any
        updates.tonerCosts = {
          ...equipment.tonerCosts,
          blackMonthlyVolume: value,
        } as any
      } else {
        updates.clickCharges = {
          ...equipment.clickCharges,
          color: {
            ...equipment.clickCharges?.color,
            monthlyVolume: value,
          },
        } as any
        updates.tonerCosts = {
          ...equipment.tonerCosts,
          colorMonthlyVolume: value,
        } as any
      }
    } else if (field === "growth") {
      // Update both click charges and toner costs growth
      if (colorType === "black") {
        updates.clickCharges = {
          ...equipment.clickCharges,
          black: {
            ...equipment.clickCharges?.black,
            growthPercent: value,
          },
        } as any
        updates.tonerCosts = {
          ...equipment.tonerCosts,
          blackVolumeGrowthPercent: value,
        } as any
      } else {
        updates.clickCharges = {
          ...equipment.clickCharges,
          color: {
            ...equipment.clickCharges?.color,
            growthPercent: value,
          },
        } as any
        updates.tonerCosts = {
          ...equipment.tonerCosts,
          colorVolumeGrowthPercent: value,
        } as any
      }
    }

    onChange(updates)
  }

  // Get unified volume values (prefer click charges, fallback to toner costs)
  const getUnifiedVolume = (
    colorType: "black" | "color",
    field: "volume" | "growth"
  ) => {
    // Handle growth % default logic
    if (field === "growth") {
      if ((index > 0 && allCurrentEquipment.length > 0) || (type === "proposed")) {
        // First try the equipment’s own growthPercent
        const ownValue =
          colorType === "black"
            ? equipment.clickCharges?.black?.growthPercent ??
            equipment.tonerCosts?.blackVolumeGrowthPercent
            : equipment.clickCharges?.color?.growthPercent ??
            equipment.tonerCosts?.colorVolumeGrowthPercent

        if (ownValue !== undefined && ownValue !== null) {
          return ownValue
        }

        // Otherwise, fallback to first equipment’s growthPercent
        const first = allCurrentEquipment[0]
        return colorType === "black"
          ? first.clickCharges?.black?.growthPercent ??
          first.tonerCosts?.blackVolumeGrowthPercent ??
          ""
          : first.clickCharges?.color?.growthPercent ??
          first.tonerCosts?.colorVolumeGrowthPercent ??
          ""
      }
    }

    // Normal logic for volume or growth
    if (field === "volume") {
      return colorType === "black"
        ? equipment.clickCharges?.black?.monthlyVolume ??
        equipment.tonerCosts?.blackMonthlyVolume ??
        ""
        : equipment.clickCharges?.color?.monthlyVolume ??
        equipment.tonerCosts?.colorMonthlyVolume ??
        ""
    } else {
      return colorType === "black"
        ? equipment.clickCharges?.black?.growthPercent ??
        equipment.tonerCosts?.blackVolumeGrowthPercent ??
        ""
        : equipment.clickCharges?.color?.growthPercent ??
        equipment.tonerCosts?.colorVolumeGrowthPercent ??
        ""
    }
  }



  // Calculate unified volume totals for comparison
  const currentTotals = calculateUnifiedVolumeTotals(allCurrentEquipment)
  const proposedTotals = calculateUnifiedVolumeTotals(allProposedEquipment)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {type === "current" ? "Current" : "Proposed"} Equipment #{index + 1}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Equipment Details */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Brand *</Label>
            <Input
              value={equipment.brand}
              onChange={(e) => onChange({ brand: e.target.value })}
              placeholder="Equipment brand"
            />
          </div>
          <div className="space-y-2">
            <Label>Model *</Label>
            <Input
              value={equipment.model}
              onChange={(e) => onChange({ model: e.target.value })}
              placeholder="Equipment model"
            />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={equipment.location}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="Equipment location"
            />
          </div>
        </div>

        {type === "current" && (
          <div className="space-y-2">
            <Label>Serial Number</Label>
            <Input
              value={equipment.serialNumber || ""}
              onChange={(e) => onChange({ serialNumber: e.target.value })}
              placeholder="Serial number"
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={equipment.type} onValueChange={(value: "black" | "color") => onChange({ type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="color">Color and Black Printer</SelectItem>
                <SelectItem value="black">Black Printer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ownership</Label>
            <Select
              value={equipment.ownership}
              onValueChange={(value: "lease" | "cash") => onChange({ ownership: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lease">Lease / Rental</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id={`copyBased-${equipment.id}`}
            checked={equipment.copyBasedService}
            onCheckedChange={(checked) => onChange({ copyBasedService: !!checked })}
          />
          <Label htmlFor={`copyBased-${equipment.id}`}>Click Based Service Charge?</Label>
        </div>

        {/* Optional Lease Calculation for Proposed Equipment */}
        {type === "proposed" && equipment.ownership === "lease" && (
          <Collapsible open={showLeaseCalculation} onOpenChange={setShowLeaseCalculation}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-transparent">
                <span>Lease Calculation (Optional)</span>
                {showLeaseCalculation ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lease Calculation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Cash Price</Label>
                      <Input
                        type="number"
                        value={equipment.cashPrice || ""}
                        onChange={(e) => {
                          const newCashPrice = e.target.value
                          onChange({ cashPrice: newCashPrice })
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Settlement</Label>
                      <Input
                        type="number"
                        value={equipment.settlement || ""}
                        onChange={(e) => {
                          const newSettlement = e.target.value
                          onChange({ settlement: newSettlement })
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Selling Price</Label>
                      <Input type="number" value={sellingPrice} placeholder="0.00" readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Rental Factor</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={equipment.rentalFactor || ""}
                        onChange={(e) => {
                          const newRentalFactor = e.target.value
                          onChange({ rentalFactor: newRentalFactor })
                        }}
                        placeholder="0.000000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Calculated Rental Amount</Label>
                    <Input type="number" value={rentalAmount} placeholder="0.00" readOnly />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {type === "proposed" && equipment.ownership === "cash" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cash Purchase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cash Price</Label>
                <Input
                  type="number"
                  value={equipment.cashPrice || ""}
                  onChange={(e) => onChange({ cashPrice: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-sm text-muted-foreground">
                  This amount will create a negative cash flow in month 1 only
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lease Details */}
        {equipment.ownership === "lease" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lease / Rental Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Lease / Rental Amount</Label>
                  <Input
                    type="number"
                    value={equipment.leaseDetails?.monthlyAmount || ""}
                    onChange={(e) => updateLeaseDetails("monthlyAmount", e.target.value)}
                    placeholder="0.00"
                    readOnly={showLeaseCalculation}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Escalation %</Label>
                  <Input
                    type="number"
                    value={equipment.leaseDetails?.annualEscalation || ""}
                    onChange={(e) => updateLeaseDetails("annualEscalation", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{type === "proposed" ? "Contract length (months)" : "Months Remaining"}</Label>
                  <Input
                    type="number"
                    value={equipment.leaseDetails?.monthsRemaining || ""}
                    onChange={(e) => updateLeaseDetails("monthsRemaining", Number.parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Frequency</Label>
                  <Select
                    value={equipment.leaseDetails?.paymentFrequency || "monthly"}
                    onValueChange={(value) => updateLeaseDetails("paymentFrequency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`evergreen-${equipment.id}`}
                  checked={equipment.leaseDetails?.evergreenRental || false}
                  onCheckedChange={(checked) => updateLeaseDetails("evergreenRental", !!checked)}
                />
                <Label htmlFor={`evergreen-${equipment.id}`}>
                  Does the Rental Reduce after the Initial Period (Evergreen)?
                </Label>
              </div>
              {equipment.leaseDetails?.evergreenRental && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Reduced Rate %</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>If the lease/rental reduces by 20%, enter 80%</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="number"
                    value={equipment.leaseDetails?.reducedRate || ""}
                    onChange={(e) => updateLeaseDetails("reducedRate", e.target.value)}
                    placeholder="0.00"
                  />
                  {/* <p className="text-sm text-muted-foreground">If the lease/rental reduces by 20%, enter 80%</p> */}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Volume and Growth Settings - Unified for both Click and Toner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Volume and Growth Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monthly Volumes */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Black Volume and Growth</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Black Monthly Volume</Label>
                  <Input
                    type="number"
                    value={getUnifiedVolume("black", "volume")}
                    onChange={(e) => updateUnifiedVolume("black", "volume", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Black Volume Growth % (Annual)</Label>
                  <Input
                    type="number"
                    value={getUnifiedVolume("black", "growth")}
                    onChange={(e) => updateUnifiedVolume("black", "growth", e.target.value)}
                    placeholder="0.00"
                    readOnly={
                      (type === "current" && applyGrowthToAll && index > 0) ||
                      (type === "proposed" && applyGrowthToAll)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Volume Growth Rates */}
            {equipment.type === "color" && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Color Volume and Growth</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Color Monthly Volume</Label>
                    <Input
                      type="number"
                      value={getUnifiedVolume("color", "volume")}
                      onChange={(e) => updateUnifiedVolume("color", "volume", e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Color Volume Growth % (Annual)</Label>
                    <Input
                      type="number"
                      value={getUnifiedVolume("color", "growth")}
                      onChange={(e) => updateUnifiedVolume("color", "growth", e.target.value)}
                      placeholder="0.00"
                      readOnly={
                        (type === "current" && applyGrowthToAll && index > 0 && allCurrentEquipment[0]?.type === "color") ||
                        (type === "proposed" && applyGrowthToAll && allCurrentEquipment[0]?.type === "color")
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {index === 0 && type === "current" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div></div>
                <div className="flex items-center row-re space-x-2">
                  <Checkbox
                    checked={applyGrowthToAll}
                    onCheckedChange={(checked) => setApplyGrowthToAll(!!checked)}
                  />
                  <Label >
                    Apply these volume growth percentages globally
                  </Label>
                </div>
              </div>
            )}

            {/* Unified Volume Comparison Table for Proposed Equipment */}
            {type === "proposed" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Volume Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {/* Table Header */}
                    <div className="grid grid-cols-4 gap-4 font-medium">
                      <span>Type</span>
                      <span>Current Total</span>
                      <span>Proposed Total</span>
                      <span>Difference</span>
                    </div>

                    {/* Black Volume Row */}
                    <div className="grid grid-cols-4 gap-4">
                      <span>Black Volume</span>
                      <span>{Number(currentTotals.black)}</span>
                      <span
                        className={
                          proposedTotals.black !== currentTotals.black
                            ? "text-orange-600 font-medium"
                            : ""
                        }
                      >
                        {Number(proposedTotals.black)}
                      </span>
                      <span
                        className={
                          proposedTotals.black - currentTotals.black !== 0
                            ? "text-orange-600 font-medium"
                            : ""
                        }
                      >
                        {Math.abs(proposedTotals.black - currentTotals.black).toLocaleString()}

                      </span>
                    </div>

                    {/* Color Volume Row */}
                    <div className="grid grid-cols-4 gap-4">
                      <span>Color Volume</span>
                      <span>{Number(currentTotals.color)}</span>
                      <span
                        className={
                          proposedTotals.color !== currentTotals.color
                            ? "text-orange-600 font-medium"
                            : ""
                        }
                      >
                        {Number(proposedTotals.color)}
                      </span>
                      <span
                        className={
                          proposedTotals.color - currentTotals.color !== 0
                            ? "text-orange-600 font-medium"
                            : ""
                        }
                      >
                        {Math.abs(proposedTotals.color - currentTotals.color).toLocaleString()}

                      </span>
                    </div>

                    {/* Warning Message */}
                    {(proposedTotals.black !== currentTotals.black ||
                      proposedTotals.color !== currentTotals.color) && (
                        <p className="text-orange-600 text-xs mt-2">
                          ⚠️ Proposed volumes don't match current volumes
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>
            )}

          </CardContent>
        </Card>

        {/* Click Charges */}
        {equipment.copyBasedService && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Click Charges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Black Click Charges */}
              <div className="space-y-4">
                <h4 className="font-medium">Black Click Charges</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Rate per Click *if 1c/click enter 0.01</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={equipment.clickCharges?.black?.rate || ""}
                      onChange={(e) => updateClickCharges("black", "rate", e.target.value)}
                      placeholder="0.000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Black Click Rate Escalation % (Annual)</Label>
                    <Input
                      type="number"
                      value={equipment.clickCharges?.black?.escalationPercent || ""}
                      onChange={(e) => updateClickCharges("black", "escalationPercent", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Color Click Charges */}
              {equipment.type === "color" && (
                <div className="space-y-4">
                  <h4 className="font-medium">Color Click Charges</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Rate per Click *if 1c/click enter 0.01</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={equipment.clickCharges?.color?.rate || ""}
                        onChange={(e) => updateClickCharges("color", "rate", e.target.value)}
                        placeholder="0.000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color Click Rate Escalation % (Annual)</Label>
                      <Input
                        type="number"
                        value={equipment.clickCharges?.color?.escalationPercent || ""}
                        onChange={(e) => updateClickCharges("color", "escalationPercent", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Toner/Ink Costs */}
        {!equipment.copyBasedService && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Toner/Ink Costs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cartridge Costs */}
              <div className="space-y-4">
                <h4 className="font-medium">Cartridge Costs</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Black Cost per Cartridge</Label>
                    <Input
                      type="number"
                      value={equipment.tonerCosts?.blackCostPerCartridge || ""}
                      onChange={(e) => updateTonerCosts("blackCostPerCartridge", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  {equipment.type === "color" && (
                    <div className="space-y-2">
                      <Label>Color Cost per Cartridge</Label>
                      <Input
                        type="number"
                        value={equipment.tonerCosts?.colorCostPerCartridge || ""}
                        onChange={(e) => updateTonerCosts("colorCostPerCartridge", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Cartridge Specifications */}
              <div className="space-y-4">
                <h4 className="font-medium">Cartridge Specifications</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  {equipment.type === "color" && (
                    <div className="space-y-2">
                      <Label>Number of Color Cartridges</Label>
                      <Input
                        type="number"
                        value={equipment.tonerCosts?.numberOfColorCartridges || ""}
                        onChange={(e) =>
                          updateTonerCosts("numberOfColorCartridges", Number.parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Black Yield per Unit</Label>
                    <Input
                      type="number"
                      value={equipment.tonerCosts?.blackYieldPerUnit || ""}
                      onChange={(e) => updateTonerCosts("blackYieldPerUnit", Number.parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  {equipment.type === "color" && (
                    <div className="space-y-2">
                      <Label>Color Yield per Unit</Label>
                      <Input
                        type="number"
                        value={equipment.tonerCosts?.colorYieldPerUnit || ""}
                        onChange={(e) => updateTonerCosts("colorYieldPerUnit", Number.parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Annual Cost Increases */}
              <div className="space-y-4">
                <h4 className="font-medium">Annual Cost Increases</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Black Toner/Ink Cost Increase % (Annual)</Label>
                    <Input
                      type="number"
                      value={equipment.tonerCosts?.blackCostEscalationPercent || ""}
                      onChange={(e) => updateTonerCosts("blackCostEscalationPercent", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  {equipment.type === "color" && (
                    <div className="space-y-2">
                      <Label>Color Toner/Ink Cost Increase % (Annual)</Label>
                      <Input
                        type="number"
                        value={equipment.tonerCosts?.colorCostEscalationPercent || ""}
                        onChange={(e) => updateTonerCosts("colorCostEscalationPercent", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proposed Equipment Savings */}
        {type === "proposed" && (
          <div className="space-y-2">
            <div className="flex">
              <Label>Savings per Month (if applicable)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 ml-2 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>If there are any additional savings that are attributable to this machine, they should be listed here eg. if one can put a value on time saved by an operator etc.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Input
              type="number"
              value={equipment.savingsPerMonth || ""}
              onChange={(e) => onChange({ savingsPerMonth: e.target.value })}
              placeholder="0.00"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
