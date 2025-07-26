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
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  aggregateEquipmentCashFlows,
  calculateNPV,
  calculatePaybackPeriod,
  calculateAnnualTotals,
  type MonthlyBreakdown,
} from "@/lib/equipment-calculations"

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

interface AnalysisData {
  chartData: CashFlowData[]
  currentNPV: number
  proposedNPV: number
  npvSavings: number
  totalCurrentCost: number
  totalProposedCost: number
  firstMonthSavings: number
  allDetails: MonthlyBreakdown[]
  currentCashFlows: number[]
  proposedCashFlows: number[]
  paybackPeriodMonths: number | null
}

export function AnalysisResults({ clientDetails, currentEquipment, proposedEquipment }: AnalysisResultsProps) {
  const [analysisYears, setAnalysisYears] = useState<number>(5)
  const [discountRateAnnual, setDiscountRateAnnual] = useState<number>(8)
  const [customDiscountRate, setCustomDiscountRate] = useState<string>("")

  const analysisData = useMemo((): AnalysisData => {
    const monthlyDiscountRate = discountRateAnnual / 100 / 12
    const totalMonths = analysisYears * 12

    // Calculate cash flows for current equipment
    const currentResult = aggregateEquipmentCashFlows(currentEquipment, totalMonths, "current")

    // Calculate cash flows for proposed equipment
    const proposedResult = aggregateEquipmentCashFlows(proposedEquipment, totalMonths, "proposed")

    // Calculate NPV values
    const currentNPV = calculateNPV(currentResult.totalCashFlows, monthlyDiscountRate)
    const proposedNPV = calculateNPV(proposedResult.totalCashFlows, monthlyDiscountRate)
    const npvSavings = currentNPV - proposedNPV

    // Calculate savings flows for payback period
    const savingsFlows = currentResult.totalCashFlows.map(
      (current, index) => current - proposedResult.totalCashFlows[index],
    )
    const paybackPeriodMonths = calculatePaybackPeriod(savingsFlows)

    // Prepare chart data
    const chartData: CashFlowData[] = []
    for (let i = 0; i < totalMonths; i++) {
      chartData.push({
        month: i + 1,
        current: currentResult.totalCashFlows[i],
        proposed: proposedResult.totalCashFlows[i],
        savings: savingsFlows[i],
      })
    }

    // Calculate summary metrics
    const totalCurrentCost = currentResult.totalCashFlows.reduce((sum, cost) => sum + cost, 0)
    const totalProposedCost = proposedResult.totalCashFlows.reduce((sum, cost) => sum + cost, 0)
    const firstMonthSavings = savingsFlows[0]

    // Combine all breakdowns
    const allDetails = [...currentResult.allBreakdowns, ...proposedResult.allBreakdowns]

    return {
      chartData,
      currentNPV,
      proposedNPV,
      npvSavings,
      totalCurrentCost,
      totalProposedCost,
      firstMonthSavings,
      allDetails,
      currentCashFlows: currentResult.totalCashFlows,
      proposedCashFlows: proposedResult.totalCashFlows,
      paybackPeriodMonths,
    }
  }, [currentEquipment, proposedEquipment, analysisYears, discountRateAnnual])

  const handleDiscountRateChange = (value: string) => {
    if (value === "custom") {
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

  const exportToCSV = () => {
    const headers = [
      "Month",
      "Equipment",
      "Type",
      "Lease Amount",
      "Black Click Charges",
      "Color Click Charges",
      "Toner Costs",
      "Other Costs",
      "Total Monthly Cost",
      "Escalation Applied",
      "Is Payment Month",
      "Post Initial Period",
    ]

    const csvContent = [
      headers.join(","),
      ...analysisData.allDetails.map((detail) =>
        [
          detail.month,
          `"${detail.equipmentName}"`,
          detail.equipmentType,
          detail.leaseAmount.toFixed(2),
          detail.blackClickCharges.toFixed(2),
          detail.colorClickCharges.toFixed(2),
          detail.tonerCosts.toFixed(2),
          detail.otherCosts.toFixed(2),
          detail.totalMonthlyCost.toFixed(2),
          detail.escalationApplied,
          detail.isPaymentMonth,
          detail.isPostInitialPeriod,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cash-flow-analysis-${clientDetails.companyName.replace(/\s+/g, "-")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatPaybackPeriod = (months: number | null): string => {
    if (months === null) return "Beyond analysis period"
    if (months <= 12) return `${months} months`
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return remainingMonths > 0 ? `${years} years, ${remainingMonths} months` : `${years} years`
  }

  return (
    <div className="space-y-6">
      {/* Analysis Settings */}
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

      {/* Analysis Summary */}
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

      {/* Key Metrics */}
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

      {/* Charts */}
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
                data={calculateAnnualTotals(analysisData.currentCashFlows, analysisYears).map((current, index) => {
                  const proposed = calculateAnnualTotals(analysisData.proposedCashFlows, analysisYears)[index]
                  return {
                    year: `Year ${current.year}`,
                    current: current.total,
                    proposed: proposed.total,
                    savings: current.total - proposed.total,
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

      {/* Comprehensive Monthly Cash Flow Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Comprehensive Monthly Cash Flow Report</CardTitle>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableCaption>
              Detailed monthly cash flow breakdown for all equipment over {analysisYears * 12} months. Shows
              escalations, payment timing, and post-initial period adjustments.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Month</TableHead>
                <TableHead className="text-left">Equipment</TableHead>
                <TableHead className="text-left">Type</TableHead>
                <TableHead className="text-right">Lease Amount</TableHead>
                <TableHead className="text-right">Black Clicks</TableHead>
                <TableHead className="text-right">Color Clicks</TableHead>
                <TableHead className="text-right">Toner/Ink</TableHead>
                <TableHead className="text-right">Other/Savings</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Escalation</TableHead>
                <TableHead className="text-center">Payment</TableHead>
                <TableHead className="text-center">Post-Initial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysisData.allDetails.map((detail, index) => (
                <TableRow key={index} className={detail.escalationApplied ? "bg-yellow-50" : ""}>
                  <TableCell className="font-medium">{detail.month}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={detail.equipmentName}>
                    {detail.equipmentName}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        detail.equipmentType === "current" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {detail.equipmentType}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    $
                    {detail.leaseAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    $
                    {detail.blackClickCharges.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    $
                    {detail.colorClickCharges.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${detail.tonerCosts.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${detail.otherCosts.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    $
                    {detail.totalMonthlyCost.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    {detail.escalationApplied ? (
                      <span className="text-orange-600 font-medium">✓</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {detail.isPaymentMonth ? (
                      <span className="text-green-600 font-medium">✓</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {detail.isPostInitialPeriod ? (
                      <span className="text-purple-600 font-medium">✓</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Cards */}
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
                <span className="font-semibold">{formatPaybackPeriod(analysisData.paybackPeriodMonths)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
