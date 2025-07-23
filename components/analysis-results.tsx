"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ClientDetails, Equipment } from "@/app/upgrade-analysis/page"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AnalysisResultsProps {
  clientDetails: ClientDetails
  currentEquipment: Equipment[]
  proposedEquipment: Equipment[]
}

interface CashFlowData {
  month: number
  current: number
  proposed: number
  savings: number
}

interface DetailedCashFlow {
  month: number
  equipment: string
  lease: number
  blackClicks: number
  colorClicks: number
  toner: number
  savings: number
  total: number
}

export function AnalysisResults({ clientDetails, currentEquipment, proposedEquipment }: AnalysisResultsProps) {
  const [analysisYears, setAnalysisYears] = useState<number>(5)
  const [discountRateAnnual, setDiscountRateAnnual] = useState<number>(8)
  const [customDiscountRate, setCustomDiscountRate] = useState<string>("")

  const analysisData = useMemo(() => {
    const discountRate = discountRateAnnual / 100 / 12 // Annual discount rate, monthly
    const totalMonths = analysisYears * 12

    // Calculate monthly cash flows for each equipment with detailed breakdown
    const calculateEquipmentCashFlow = (
      equipment: Equipment,
      months: number,
      type: "current" | "proposed",
    ): { cashFlows: number[]; details: DetailedCashFlow[] } => {
      const cashFlows: number[] = []
      const details: DetailedCashFlow[] = []

      for (let month = 1; month <= months; month++) {
        let monthlyCost = 0
        let leaseCost = 0
        let blackClickCost = 0
        let colorClickCost = 0
        let tonerCost = 0
        let savingsCost = 0

        // Lease costs with proper escalation timing
        if (equipment.ownership === "lease" && equipment.leaseDetails) {
          const { monthlyAmount, annualEscalation, monthsRemaining, paymentFrequency, evergreenRental, reducedRate } =
            equipment.leaseDetails

          // Determine if this is a payment month for quarterly payments
          const isPaymentMonth = paymentFrequency === "monthly" || (paymentFrequency === "quarterly" && month % 3 === 1)

          if (isPaymentMonth) {
            // Calculate escalation based on contract timing
            let escalationYears = 0
            if (type === "current" && monthsRemaining) {
              // For current equipment, calculate how many escalations have occurred
              const contractMonth = monthsRemaining - month + 1
              if (contractMonth > 0) {
                escalationYears = Math.floor((monthsRemaining - contractMonth) / 12)
              }
            } else {
              // For proposed equipment, escalate annually from start
              escalationYears = Math.floor((month - 1) / 12)
            }

            let escalatedAmount = monthlyAmount * Math.pow(1 + annualEscalation / 100, escalationYears)

            // Apply evergreen reduction if applicable
            if (evergreenRental && type === "current" && monthsRemaining && month > monthsRemaining) {
              escalatedAmount = (escalatedAmount * (reducedRate || 100)) / 100
            }

            // For quarterly payments, multiply by 3
            if (paymentFrequency === "quarterly") {
              escalatedAmount *= 3
            }

            leaseCost = escalatedAmount
            monthlyCost += escalatedAmount
          }
        }

        // Click charges
        if (equipment.copyBasedService && equipment.clickCharges) {
          const yearsPassed = Math.floor((month - 1) / 12)
          const monthlyGrowthRate = Math.pow(1 + (equipment.clickCharges.black.growthPercent || 0) / 100, 1 / 12) - 1

          // Black clicks
          const blackVolume = equipment.clickCharges.black.monthlyVolume * Math.pow(1 + monthlyGrowthRate, month - 1)
          const blackRate =
            equipment.clickCharges.black.rate *
            Math.pow(1 + (equipment.clickCharges.black.escalationPercent || 0) / 100, yearsPassed)
          blackClickCost = blackVolume * blackRate
          monthlyCost += blackClickCost

          // Color clicks
          if (equipment.type === "color" && equipment.clickCharges.color) {
            const colorVolume = equipment.clickCharges.color.monthlyVolume * Math.pow(1 + monthlyGrowthRate, month - 1)
            const colorRate =
              equipment.clickCharges.color.rate *
              Math.pow(1 + (equipment.clickCharges.color.escalationPercent || 0) / 100, yearsPassed)
            colorClickCost = colorVolume * colorRate
            monthlyCost += colorClickCost
          }
        }

        // Toner costs (simplified calculation)
        if (!equipment.copyBasedService && equipment.tonerCosts) {
          const yearsPassed = Math.floor((month - 1) / 12)
          const escalatedTonerCost =
            equipment.tonerCosts.blackCostPerCartridge *
            Math.pow(1 + (equipment.tonerCosts.escalationPercent || 0) / 100, yearsPassed)
          tonerCost += escalatedTonerCost / 12 // Approximate monthly toner cost

          if (equipment.type === "color" && equipment.tonerCosts.colorCostPerCartridge) {
            const escalatedColorTonerCost =
              equipment.tonerCosts.colorCostPerCartridge *
              Math.pow(1 + (equipment.tonerCosts.escalationPercent || 0) / 100, yearsPassed)
            tonerCost += escalatedColorTonerCost / 12
          }
          monthlyCost += tonerCost
        }

        // Proposed equipment savings
        if (equipment.savingsPerMonth) {
          savingsCost = equipment.savingsPerMonth
          monthlyCost -= equipment.savingsPerMonth
        }

        cashFlows.push(monthlyCost)
        details.push({
          month,
          equipment: `${equipment.brand} ${equipment.model}`,
          lease: leaseCost,
          blackClicks: blackClickCost,
          colorClicks: colorClickCost,
          toner: tonerCost,
          savings: savingsCost,
          total: monthlyCost,
        })
      }

      return { cashFlows, details }
    }

    // Calculate total cash flows and detailed breakdown
    const currentCashFlows = Array(totalMonths).fill(0)
    const proposedCashFlows = Array(totalMonths).fill(0)
    const allDetails: DetailedCashFlow[] = []

    currentEquipment.forEach((equipment) => {
      const { cashFlows, details } = calculateEquipmentCashFlow(equipment, totalMonths, "current")
      cashFlows.forEach((flow, index) => {
        currentCashFlows[index] += flow
      })
      allDetails.push(...details.map((d) => ({ ...d, equipment: `[Current] ${d.equipment}` })))
    })

    proposedEquipment.forEach((equipment) => {
      const { cashFlows, details } = calculateEquipmentCashFlow(equipment, totalMonths, "proposed")
      cashFlows.forEach((flow, index) => {
        proposedCashFlows[index] += flow
      })
      allDetails.push(...details.map((d) => ({ ...d, equipment: `[Proposed] ${d.equipment}` })))
    })

    // Calculate NPV
    const calculateNPV = (cashFlows: number[]): number => {
      return cashFlows.reduce((npv, cashFlow, index) => {
        return npv + cashFlow / Math.pow(1 + discountRate, index + 1)
      }, 0)
    }

    const currentNPV = calculateNPV(currentCashFlows)
    const proposedNPV = calculateNPV(proposedCashFlows)
    const npvSavings = currentNPV - proposedNPV

    // Prepare chart data
    const chartData: CashFlowData[] = []
    for (let i = 0; i < totalMonths; i++) {
      chartData.push({
        month: i + 1,
        current: currentCashFlows[i],
        proposed: proposedCashFlows[i],
        savings: currentCashFlows[i] - proposedCashFlows[i],
      })
    }

    // First month savings
    const firstMonthSavings = currentCashFlows[0] - proposedCashFlows[0]

    return {
      chartData,
      currentNPV,
      proposedNPV,
      npvSavings,
      totalCurrentCost: currentCashFlows.reduce((sum, cost) => sum + cost, 0),
      totalProposedCost: proposedCashFlows.reduce((sum, cost) => sum + cost, 0),
      firstMonthSavings,
      allDetails,
    }
  }, [currentEquipment, proposedEquipment, analysisYears, discountRateAnnual])

  const handleDiscountRateChange = (value: string) => {
    if (value === "custom") {
      // Allow custom input
      return
    }
    setDiscountRateAnnual(Number.parseInt(value))
    setCustomDiscountRate("")
  }

  const handleCustomDiscountRateChange = (value: string) => {
    setCustomDiscountRate(value)
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setDiscountRateAnnual(numValue)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analysis Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="analysisPeriod" className="block text-sm font-medium text-gray-700">
                Analysis Period (Years)
              </Label>
              <Select
                value={analysisYears.toString()}
                onValueChange={(value) => setAnalysisYears(Number.parseInt(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                  <SelectItem value="7">7 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discountRate" className="block text-sm font-medium text-gray-700">
                Discount Rate (Annual %)
              </Label>
              <div className="flex gap-2">
                <Select
                  value={customDiscountRate ? "custom" : discountRateAnnual.toString()}
                  onValueChange={handleDiscountRateChange}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6%</SelectItem>
                    <SelectItem value="8">8%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {(customDiscountRate || discountRateAnnual.toString() === "custom") && (
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Enter %"
                    value={customDiscountRate}
                    onChange={(e) => handleCustomDiscountRateChange(e.target.value)}
                    className="w-[100px]"
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium text-gray-900">Client Details</h3>
              <p className="text-sm text-gray-600">Company: {clientDetails.companyName}</p>
              <p className="text-sm text-gray-600">Email: {clientDetails.email}</p>
              {clientDetails.referenceNumber && (
                <p className="text-sm text-gray-600">Reference: {clientDetails.referenceNumber}</p>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Equipment Count</h3>
              <p className="text-sm text-gray-600">Current Equipment: {currentEquipment.length}</p>
              <p className="text-sm text-gray-600">Proposed Equipment: {proposedEquipment.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current NPV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${analysisData.currentNPV.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-600 mt-1">{analysisYears}-year net present value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proposed NPV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              $
              {analysisData.proposedNPV.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-sm text-gray-600 mt-1">{analysisYears}-year net present value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">NPV Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analysisData.npvSavings >= 0 ? "text-green-600" : "text-red-600"}`}>
              $
              {Math.abs(analysisData.npvSavings).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-sm text-gray-600 mt-1">{analysisData.npvSavings >= 0 ? "Savings" : "Additional cost"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Cash Flow Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysisData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" label={{ value: "Month", position: "insideBottom", offset: -5 }} />
                <YAxis
                  label={{ value: "Monthly Cost ($)", angle: -90, position: "insideLeft" }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels = {
                      current: "Current Equipment",
                      proposed: "Proposed Equipment",
                      savings: "Monthly Savings",
                    }
                    return [
                      `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      labels[name as keyof typeof labels] || name,
                    ]
                  }}
                  labelFormatter={(month) => `Month ${month}`}
                />
                <Legend />
                <Line type="monotone" dataKey="current" stroke="#ef4444" strokeWidth={2} name="Current Equipment" />
                <Line type="monotone" dataKey="proposed" stroke="#3b82f6" strokeWidth={2} name="Proposed Equipment" />
                <Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} name="Monthly Savings" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Annual Cost Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Array.from({ length: analysisYears }, (_, yearIndex) => {
                  const year = yearIndex + 1
                  const startMonth = yearIndex * 12
                  const endMonth = year * 12
                  const currentYearCost = analysisData.chartData
                    .slice(startMonth, endMonth)
                    .reduce((sum, month) => sum + month.current, 0)
                  const proposedYearCost = analysisData.chartData
                    .slice(startMonth, endMonth)
                    .reduce((sum, month) => sum + month.proposed, 0)

                  return {
                    year: `Year ${year}`,
                    current: currentYearCost,
                    proposed: proposedYearCost,
                    savings: currentYearCost - proposedYearCost,
                  }
                })}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels = {
                      current: "Current Equipment",
                      proposed: "Proposed Equipment",
                      savings: "Annual Savings",
                    }
                    return [
                      `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      labels[name as keyof typeof labels] || name,
                    ]
                  }}
                />
                <Legend />
                <Bar dataKey="current" fill="#ef4444" name="Current Equipment" />
                <Bar dataKey="proposed" fill="#3b82f6" name="Proposed Equipment" />
                <Bar dataKey="savings" fill="#10b981" name="Annual Savings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Cash Flow Analysis</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableCaption>
              Detailed monthly cash flow breakdown for all equipment over {analysisYears * 12} months.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Month</TableHead>
                <TableHead className="text-left">Equipment</TableHead>
                <TableHead className="text-right">Lease</TableHead>
                <TableHead className="text-right">Black Clicks</TableHead>
                <TableHead className="text-right">Color Clicks</TableHead>
                <TableHead className="text-right">Toner</TableHead>
                <TableHead className="text-right">Savings</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysisData.allDetails.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{detail.month}</TableCell>
                  <TableCell>{detail.equipment}</TableCell>
                  <TableCell className="text-right">
                    ${detail.lease.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    $
                    {detail.blackClicks.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    $
                    {detail.colorClicks.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${detail.toner.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${detail.savings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${detail.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{analysisYears}-Year Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Equipment:</span>
                <span className="font-semibold text-red-600">
                  $
                  {analysisData.totalCurrentCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Proposed Equipment:</span>
                <span className="font-semibold text-blue-600">
                  $
                  {analysisData.totalProposedCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Savings:</span>
                  <span
                    className={`font-bold ${(analysisData.totalCurrentCost - analysisData.totalProposedCost) >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    $
                    {Math.abs(analysisData.totalCurrentCost - analysisData.totalProposedCost).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>First Month Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${analysisData.firstMonthSavings >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              $
              {Math.abs(analysisData.firstMonthSavings).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {analysisData.firstMonthSavings >= 0 ? "Month 1 Savings" : "Month 1 Additional Cost"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Discount Rate:</span>
                <span className="font-semibold">{discountRateAnnual}% annual</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Analysis Period:</span>
                <span className="font-semibold">
                  {analysisYears} years ({analysisYears * 12} months)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ROI:</span>
                <span className={`font-semibold ${analysisData.npvSavings >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {analysisData.proposedNPV !== 0
                    ? `${((analysisData.npvSavings / Math.abs(analysisData.proposedNPV)) * 100).toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payback Period:</span>
                <span className="font-semibold">{analysisData.npvSavings > 0 ? "Immediate" : "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
