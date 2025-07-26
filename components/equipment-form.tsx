"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { Equipment } from "@/app/upgrade-analysis/page"
import { useEffect, useState } from "react"
import { calculateVolumeTotals } from "@/lib/equipment-calculations"

interface EquipmentFormProps {
  equipment: Equipment
  index: number
  type: "current" | "proposed"
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
  allCurrentEquipment = [],
  allProposedEquipment = [],
}: EquipmentFormProps) {
  const [sellingPrice, setSellingPrice] = useState<number>(equipment.sellingPrice || 0)
  const [rentalAmount, setRentalAmount] = useState<number>(0)

  useEffect(() => {
    if (equipment.cashPrice !== undefined && equipment.settlement !== undefined) {
      const newSellingPrice = equipment.cashPrice + equipment.settlement
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
      const newRentalAmount = (equipment.cashPrice + equipment.settlement) * equipment.rentalFactor
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

  // Calculate volume totals for comparison using the modular function
  const currentTotals = calculateVolumeTotals(allCurrentEquipment)
  const proposedTotals = calculateVolumeTotals(allProposedEquipment)

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
                <SelectItem value="black">Black Printer</SelectItem>
                <SelectItem value="color">Color and Black Printer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ownership</Label>
            <Select
              value={equipment.ownership}
              onValueChange={(value: "lease" | "owned" | "cash") => onChange({ ownership: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lease">Lease / Rental</SelectItem>
                <SelectItem value="owned">Owned</SelectItem>
                {type === "proposed" && <SelectItem value="cash">Cash</SelectItem>}
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

        {/* Proposed Equipment Specific Fields */}
        {type === "proposed" && equipment.ownership === "lease" && (
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
                      const newCashPrice = Number.parseFloat(e.target.value) || 0
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
                      const newSettlement = Number.parseFloat(e.target.value) || 0
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
                      const newRentalFactor = Number.parseFloat(e.target.value) || 0
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
                    onChange={(e) => updateLeaseDetails("monthlyAmount", Number.parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Escalation %</Label>
                  <Input
                    type="number"
                    value={equipment.leaseDetails?.annualEscalation || ""}
                    onChange={(e) => updateLeaseDetails("annualEscalation", Number.parseFloat(e.target.value) || 0)}
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
                  <Label>Reduced Rate %</Label>
                  <Input
                    type="number"
                    value={equipment.leaseDetails?.reducedRate || ""}
                    onChange={(e) => updateLeaseDetails("reducedRate", Number.parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-muted-foreground">If the lease/rental reduces by 20%, enter 80%</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                      onChange={(e) => updateClickCharges("black", "rate", Number.parseFloat(e.target.value) || 0)}
                      placeholder="0.000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Click Rate Escalation % (Annual)</Label>
                    <Input
                      type="number"
                      value={equipment.clickCharges?.black?.escalationPercent || ""}
                      onChange={(e) =>
                        updateClickCharges("black", "escalationPercent", Number.parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Monthly Volume</Label>
                    <Input
                      type="number"
                      value={equipment.clickCharges?.black?.monthlyVolume || ""}
                      onChange={(e) =>
                        updateClickCharges("black", "monthlyVolume", Number.parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Volume Growth Rate %</Label>
                    <Input
                      type="number"
                      value={equipment.clickCharges?.black?.growthPercent || ""}
                      onChange={(e) =>
                        updateClickCharges("black", "growthPercent", Number.parseFloat(e.target.value) || 0)
                      }
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
                        onChange={(e) => updateClickCharges("color", "rate", Number.parseFloat(e.target.value) || 0)}
                        placeholder="0.000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Click Rate Escalation % (Annual)</Label>
                      <Input
                        type="number"
                        value={equipment.clickCharges?.color?.escalationPercent || ""}
                        onChange={(e) =>
                          updateClickCharges("color", "escalationPercent", Number.parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Monthly Volume</Label>
                      <Input
                        type="number"
                        value={equipment.clickCharges?.color?.monthlyVolume || ""}
                        onChange={(e) =>
                          updateClickCharges("color", "monthlyVolume", Number.parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Annual Volume Growth Rate %</Label>
                      <Input
                        type="number"
                        value={equipment.clickCharges?.color?.growthPercent || ""}
                        onChange={(e) =>
                          updateClickCharges("color", "growthPercent", Number.parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Volume Comparison Table for Proposed Equipment */}
              {type === "proposed" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Volume Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-4 font-medium">
                        <span>Type</span>
                        <span>Current Total</span>
                        <span>Proposed Total</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span>Black Volume</span>
                        <span>{currentTotals.black.toLocaleString()}</span>
                        <span
                          className={proposedTotals.black !== currentTotals.black ? "text-orange-600 font-medium" : ""}
                        >
                          {proposedTotals.black.toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span>Color Volume</span>
                        <span>{currentTotals.color.toLocaleString()}</span>
                        <span
                          className={proposedTotals.color !== currentTotals.color ? "text-orange-600 font-medium" : ""}
                        >
                          {proposedTotals.color.toLocaleString()}
                        </span>
                      </div>
                      {(proposedTotals.black !== currentTotals.black ||
                        proposedTotals.color !== currentTotals.color) && (
                        <p className="text-orange-600 text-xs mt-2">⚠️ Proposed volumes don't match current volumes</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Black Cost per Cartridge</Label>
                  <Input
                    type="number"
                    value={equipment.tonerCosts?.blackCostPerCartridge || ""}
                    onChange={(e) => updateTonerCosts("blackCostPerCartridge", Number.parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                {equipment.type === "color" && (
                  <div className="space-y-2">
                    <Label>Color Cost per Cartridge</Label>
                    <Input
                      type="number"
                      value={equipment.tonerCosts?.colorCostPerCartridge || ""}
                      onChange={(e) =>
                        updateTonerCosts("colorCostPerCartridge", Number.parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Number of Cartridges</Label>
                  <Input
                    type="number"
                    value={equipment.tonerCosts?.numberOfCartridges || ""}
                    onChange={(e) => updateTonerCosts("numberOfCartridges", Number.parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yield per Unit</Label>
                  <Input
                    type="number"
                    value={equipment.tonerCosts?.yieldPerUnit || ""}
                    onChange={(e) => updateTonerCosts("yieldPerUnit", Number.parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Escalation % (Annual)</Label>
                  <Input
                    type="number"
                    value={equipment.tonerCosts?.escalationPercent || ""}
                    onChange={(e) => updateTonerCosts("escalationPercent", Number.parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proposed Equipment Savings */}
        {type === "proposed" && (
          <div className="space-y-2">
            <Label>Savings per Month (if applicable)</Label>
            <Input
              type="number"
              value={equipment.savingsPerMonth || ""}
              onChange={(e) => onChange({ savingsPerMonth: Number.parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
