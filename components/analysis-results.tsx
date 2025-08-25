"use client"

import { useMemo, useState, useEffect } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Download, ChevronDown, ChevronRight, Monitor, Printer, Save, Loader2 } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { saveAnalysis, updateAnalysis } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import {
  aggregateEquipmentCashFlows,
  calculateNPV,
  calculatePaybackPeriod,
  calculateAnnualTotals,
  calculateEquipmentCashFlow,
  type MonthlyBreakdown,
} from "@/lib/equipment-calculations"

interface AnalysisResultsProps {
  clientDetails: ClientDetails
  currentEquipment: Equipment[]
  proposedEquipment: Equipment[]
  onNavigateBack?: () => void
  initialAnalysisYears?: number
  initialDiscountRate?: number
  currencySymbol?: string
  readOnly?: boolean
  analysisId?: string
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

interface EquipmentTotalsData {
  month: number
  [key: string]: number // Dynamic equipment columns + total
}

export function AnalysisResults({
  clientDetails,
  currentEquipment,
  proposedEquipment,
  onNavigateBack,
  initialAnalysisYears = 5,
  initialDiscountRate = 8,
  currencySymbol = '$',
  readOnly = false,
  analysisId,
}: AnalysisResultsProps) {
  const { user } = useAuth()
  const [analysisYears, setAnalysisYears] = useState<number>(initialAnalysisYears)
  const [discountRateAnnual, setDiscountRateAnnual] = useState<number>(initialDiscountRate)
  const [customDiscountRate, setCustomDiscountRate] = useState<string>("")
  const [customAnalysisYear, setCustomAnalysisYear] = useState<string>("")
  const [openEquipment, setOpenEquipment] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"individual" | "totals">("individual")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [analysisTitle, setAnalysisTitle] = useState<string>("")
  const discountOptions = ["6", "8", "10"];

  // If the current discountRateAnnual is not in options, add it
  const selectOptions = discountOptions.includes(discountRateAnnual.toString())
    ? discountOptions
    : [...discountOptions, discountRateAnnual.toString()];

  // Set default title based on client details
  useEffect(() => {
    if (!analysisTitle && clientDetails.companyName) {
      const timestamp = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      setAnalysisTitle(`${clientDetails.companyName} Analysis - ${timestamp}`)
    }
  }, [clientDetails.companyName, analysisTitle])

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

  // Generate current equipment totals data
  const currentEquipmentTotalsData = useMemo((): EquipmentTotalsData[] => {
    const totalMonths = analysisYears * 12
    const data: EquipmentTotalsData[] = []

    for (let month = 1; month <= totalMonths; month++) {
      const monthData: EquipmentTotalsData = { month }
      let monthTotal = 0

      currentEquipment.forEach((equipment) => {
        const cashFlowData = calculateEquipmentCashFlow(equipment, totalMonths, "current")
        const monthlyBreakdown = cashFlowData.monthlyBreakdowns.find((b) => b.month === month)
        const equipmentName = `${equipment.brand} ${equipment.model}`
        const value = monthlyBreakdown?.totalMonthlyCost || 0

        monthData[equipmentName] = value
        monthTotal += value
      })

      monthData["Total"] = monthTotal
      data.push(monthData)
    }

    return data
  }, [currentEquipment, analysisYears])

  // Generate proposed equipment totals data
  const proposedEquipmentTotalsData = useMemo((): EquipmentTotalsData[] => {
    const totalMonths = analysisYears * 12
    const data: EquipmentTotalsData[] = []

    for (let month = 1; month <= totalMonths; month++) {
      const monthData: EquipmentTotalsData = { month }
      let monthTotal = 0

      proposedEquipment.forEach((equipment) => {
        const cashFlowData = calculateEquipmentCashFlow(equipment, totalMonths, "proposed")
        const monthlyBreakdown = cashFlowData.monthlyBreakdowns.find((b) => b.month === month)
        const equipmentName = `${equipment.brand} ${equipment.model}`
        const value = monthlyBreakdown?.totalMonthlyCost || 0

        monthData[equipmentName] = value
        monthTotal += value
      })

      monthData["Total"] = monthTotal
      data.push(monthData)
    }

    return data
  }, [proposedEquipment, analysisYears])

  const handleAnalysisYearChange = (value: string) => {
    if (value === "custom") {
      setCustomAnalysisYear(analysisYears.toString())
      return
    }
    setAnalysisYears(Number.parseFloat(value))
    setCustomAnalysisYear("")
  }

  const handleCustomAnalysisYearChange = (value: string) => {
    setCustomAnalysisYear(value)
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setAnalysisYears(numValue)
    }
  }

  const handleDiscountRateChange = (value: string) => {
    if (value === "custom") {
      setCustomDiscountRate(discountRateAnnual.toString())
      return
    }
    setDiscountRateAnnual(Number.parseFloat(value))
    setCustomDiscountRate("")
  }

  const handleCustomDiscountRateChange = (value: string) => {
    setCustomDiscountRate(value)
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setDiscountRateAnnual(numValue)
    }
  }

  const handleSaveAnalysis = async () => {
    if (!user || !analysisTitle.trim()) {
      setSaveError("Please enter a title for your analysis")
      return
    }

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const analysisSettings = {
        analysisYears,
        discountRateAnnual,
      }

      if (analysisId) {
        await updateAnalysis(
          analysisId,
          analysisTitle.trim(),
          clientDetails,
          currentEquipment,
          proposedEquipment,
          analysisSettings,
        )
        setSaveSuccess("Analysis updated successfully!")
      } else {
        await saveAnalysis(analysisTitle.trim(), clientDetails, currentEquipment, proposedEquipment, analysisSettings)
        setSaveSuccess("Analysis saved successfully!")
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save analysis")
    } finally {
      setSaving(false)
    }
  }

  const toggleEquipment = (equipmentId: string) => {
    setOpenEquipment((prev) =>
      prev.includes(equipmentId) ? prev.filter((id) => id !== equipmentId) : [...prev, equipmentId],
    )
  }

  const exportToCSV = () => {
    if (viewMode === "individual") {
      // Export individual equipment details
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
      a.download = `individual-equipment-analysis-${clientDetails.companyName.replace(/\s+/g, "-")}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      // Export equipment totals - separate files for current and proposed

      // Current Equipment CSV
      if (currentEquipment.length > 0) {
        const currentHeaders = ["Month", ...currentEquipment.map((eq) => `${eq.brand} ${eq.model}`), "Total"]

        const currentCsvContent = [
          currentHeaders.join(","),
          ...currentEquipmentTotalsData.map((row) => {
            const values: string[] = []

            // Ensure month is string
            values.push(String(row.month))

            // Push equipment values
            currentEquipment.forEach((eq) => {
              const equipmentName = `${eq.brand} ${eq.model}`
              values.push(Number(row[equipmentName] || 0).toFixed(2))
            })

            // Push total
            values.push(Number(row["Total"] || 0).toFixed(2))

            return values.join(",")
          }),
        ].join("\n")

        const currentBlob = new Blob([currentCsvContent], { type: "text/csv" })
        const currentUrl = window.URL.createObjectURL(currentBlob)
        const currentA = document.createElement("a")
        currentA.href = currentUrl
        currentA.download = `current-equipment-totals-${clientDetails.companyName.replace(/\s+/g, "-")}.csv`
        currentA.click()
        window.URL.revokeObjectURL(currentUrl)
      }

      // Proposed Equipment CSV
      if (proposedEquipment.length > 0) {
        const proposedHeaders = ["Month", ...proposedEquipment.map((eq) => `${eq.brand} ${eq.model}`), "Total"]
        const proposedCsvContent = [
          proposedHeaders.join(","),
          ...proposedEquipmentTotalsData.map((row) => {
            const values = [row.month]
            proposedEquipment.forEach((eq) => {
              const equipmentName = `${eq.brand} ${eq.model}`
              values.push(Number((row[equipmentName] || 0).toFixed(2)))
            })
            values.push(Number((row["Total"] || 0).toFixed(2)))
            return values.join(",")
          }),
        ].join("\n")

        const proposedBlob = new Blob([proposedCsvContent], { type: "text/csv" })
        const proposedUrl = window.URL.createObjectURL(proposedBlob)
        const proposedA = document.createElement("a")
        proposedA.href = proposedUrl
        proposedA.download = `proposed-equipment-totals-${clientDetails.companyName.replace(/\s+/g, "-")}.csv`
        proposedA.click()
        window.URL.revokeObjectURL(proposedUrl)
      }
    }
  }


  const getEquipmentIcon = (equipment: Equipment) => {
    return equipment.type === "color" ? (
      <Monitor className="w-4 h-4 text-blue-600" />
    ) : (
      <Printer className="w-4 h-4 text-gray-600" />
    )
  }

  const getEquipmentCashFlowData = (equipment: Equipment, type: "current" | "proposed") => {
    const totalMonths = analysisYears * 12
    return calculateEquipmentCashFlow(equipment, totalMonths, type)
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      {onNavigateBack && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={onNavigateBack}>
            ← Back to Equipment Setup
          </Button>
        </div>
      )}

      {/* Save Analysis Section */}
      {!readOnly && user && (
        <Card>
          <CardHeader>
            <CardTitle>Save Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {saveError && (
                <Alert variant="destructive">
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              {saveSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{saveSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="analysisTitle">Analysis Title</Label>
                  <Input
                    id="analysisTitle"
                    value={analysisTitle}
                    onChange={(e) => setAnalysisTitle(e.target.value)}
                    placeholder="Enter a title for this analysis"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSaveAnalysis} disabled={saving || !analysisTitle.trim()}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {analysisId ? "Update" : "Save"} Analysis
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Analysis Period */}
            <div>
              <Label htmlFor="analysisPeriod" className="block text-sm font-medium text-gray-700">
                Analysis Period (Years)
              </Label>
              <div className="flex gap-2">
                <Select
                  value={customAnalysisYear ? "custom" : analysisYears.toString()}
                  onValueChange={handleAnalysisYearChange}
                  disabled={readOnly}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Years</SelectItem>
                    <SelectItem value="3">3 Years</SelectItem>
                    <SelectItem value="4">4 Years</SelectItem>
                    <SelectItem value="5">5 Years</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                {(customAnalysisYear || analysisYears.toString() === "custom") && (
                  <Input
                    type="number"
                    step="1"
                    placeholder="Enter year"
                    value={customAnalysisYear}
                    onChange={(e) => handleCustomAnalysisYearChange(e.target.value)}
                    className="w-[100px]"
                    disabled={readOnly}
                  />
                )}
              </div>
            </div>

            {/* Discount Rate */}
            <div>
              <Label htmlFor="discountRate" className="block text-sm font-medium text-gray-700">
                Discount Rate (Annual %)
              </Label>
              <div className="flex gap-2">
                <Select
                  value={customDiscountRate ? "custom" : discountRateAnnual.toString()}
                  onValueChange={handleDiscountRateChange}
                  disabled={readOnly}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectOptions.map((rate) => (
                      <SelectItem key={rate} value={rate}>
                        {rate}%
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                {(
                  customDiscountRate ||
                  discountRateAnnual.toString() === "custom"
                ) && (
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Enter %"
                      value={customDiscountRate || discountRateAnnual}
                      onChange={(e) => handleCustomDiscountRateChange(e.target.value)}
                      className="w-[100px]"
                      disabled={readOnly}
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
              <p className="text-sm text-gray-600">
                Analysis Period: {analysisYears} years ({analysisYears * 12} months)
              </p>
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
              {currencySymbol}{analysisData.currentNPV.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              {currencySymbol}
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
              {currencySymbol}
              {Math.abs(analysisData.npvSavings).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-sm text-gray-600 mt-1">{analysisData.npvSavings >= 0 ? "Savings" : "Additional cost"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Details with View Options */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Equipment Cash Flow Details</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={viewMode} onValueChange={(value: "individual" | "totals") => setViewMode(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual Equipment</SelectItem>
                <SelectItem value="totals">Equipment Totals</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "individual" ? (
            <div className="space-y-4">
              {/* Current Equipment Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-700 border-b border-red-200 pb-2">
                  Current Equipment ({currentEquipment.length})
                </h3>
                {currentEquipment.map((equipment) => {
                  const isOpen = openEquipment.includes(equipment.id)
                  const cashFlowData = getEquipmentCashFlowData(equipment, "current")

                  return (
                    <Collapsible key={equipment.id} open={isOpen} onOpenChange={() => toggleEquipment(equipment.id)}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-4 h-auto hover:bg-red-50 border border-red-100 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getEquipmentIcon(equipment)}
                            <div className="text-left">
                              <div className="font-medium text-gray-900">
                                {equipment.brand} {equipment.model}
                              </div>
                              <div className="text-sm text-gray-600">
                                {equipment.location} • {equipment.type === "color" ? "Color & Black" : "Black Only"} •{" "}
                                {equipment.ownership}
                              </div>
                            </div>
                          </div>
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="border border-red-100 rounded-lg p-4 bg-red-50/30">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Month</TableHead>
                                  <TableHead className="text-right">Lease Amount</TableHead>
                                  <TableHead className="text-right">Black Clicks</TableHead>
                                  <TableHead className="text-right">Color Clicks</TableHead>
                                  <TableHead className="text-right">Toner/Ink</TableHead>
                                  <TableHead className="text-right">Other/Savings</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                  <TableHead className="text-center">Escalation</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cashFlowData.monthlyBreakdowns.map((detail) => (
                                  <TableRow
                                    key={detail.month}
                                    className={detail.escalationApplied ? "bg-yellow-50" : ""}
                                  >
                                    <TableCell className="font-medium">{detail.month}</TableCell>
                                    <TableCell className="text-right">
                                      {currencySymbol}
                                      {detail.leaseAmount.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {currencySymbol}
                                      {detail.blackClickCharges.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {currencySymbol}
                                      {detail.colorClickCharges.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {currencySymbol}
                                      {detail.tonerCosts.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {currencySymbol}
                                      {detail.otherCosts.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {currencySymbol}
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
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>

              {/* Proposed Equipment Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-700 border-b border-blue-200 pb-2">
                  Proposed Equipment ({proposedEquipment.length})
                </h3>
                {proposedEquipment.map((equipment) => {
                  const isOpen = openEquipment.includes(equipment.id)
                  const cashFlowData = getEquipmentCashFlowData(equipment, "proposed")

                  return (
                    <Collapsible key={equipment.id} open={isOpen} onOpenChange={() => toggleEquipment(equipment.id)}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-4 h-auto hover:bg-blue-50 border border-blue-100 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getEquipmentIcon(equipment)}
                            <div className="text-left">
                              <div className="font-medium text-gray-900">
                                {equipment.brand} {equipment.model}
                              </div>
                              <div className="text-sm text-gray-600">
                                {equipment.location} • {equipment.type === "color" ? "Color & Black" : "Black Only"} •{" "}
                                {equipment.ownership}
                              </div>
                            </div>
                          </div>
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50/30">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Month</TableHead>
                                  <TableHead className="text-right">Lease Amount/Cash</TableHead>
                                  <TableHead className="text-right">Black Clicks</TableHead>
                                  <TableHead className="text-right">Color Clicks</TableHead>
                                  <TableHead className="text-right">Toner/Ink</TableHead>
                                  <TableHead className="text-right">Other/Savings</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                  <TableHead className="text-center">Escalation</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cashFlowData.monthlyBreakdowns.map((detail) => (
                                  <TableRow
                                    key={detail.month}
                                    className={detail.escalationApplied ? "bg-yellow-50" : ""}
                                  >
                                    <TableCell className="font-medium">{detail.month}</TableCell>
                                    <TableCell className="text-right">
                                      {currencySymbol}
                                      {detail.leaseAmount.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {currencySymbol}
                                      {detail.blackClickCharges.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {currencySymbol}
                                      {detail.colorClickCharges.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {currencySymbol}
                                      {detail.tonerCosts.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {currencySymbol}
                                      {detail.otherCosts.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {currencySymbol}
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
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Equipment Totals Tables - Separate for Current and Proposed */
            <div className="space-y-8">
              {/* Current Equipment Totals */}
              {currentEquipment.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-700 border-b border-red-200 pb-2">
                    Current Equipment Monthly Totals ({currentEquipment.length} equipment)
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-white">Month</TableHead>
                          {currentEquipment.map((equipment) => (
                            <TableHead key={equipment.id} className="text-right min-w-[150px]">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {equipment.brand} {equipment.model}
                                </span>
                                <span className="text-xs text-gray-500 font-normal">{equipment.location}</span>
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className="text-right min-w-[120px] bg-red-100 font-bold">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentEquipmentTotalsData.map((row) => (
                          <TableRow key={row.month}>
                            <TableCell className="sticky left-0 bg-white font-medium">{row.month}</TableCell>
                            {currentEquipment.map((equipment) => {
                              const equipmentName = `${equipment.brand} ${equipment.model}`
                              const value = row[equipmentName] || 0

                              return (
                                <TableCell key={equipment.id} className="text-right bg-red-50/50">
                                  {currencySymbol}
                                  {value.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-right bg-red-100 font-bold">
                              {currencySymbol}
                              {(row["Total"] || 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Proposed Equipment Totals */}
              {proposedEquipment.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-700 border-b border-blue-200 pb-2">
                    Proposed Equipment Monthly Totals ({proposedEquipment.length} equipment)
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-white">Month</TableHead>
                          {proposedEquipment.map((equipment) => (
                            <TableHead key={equipment.id} className="text-right min-w-[150px]">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {equipment.brand} {equipment.model}
                                </span>
                                <span className="text-xs text-gray-500 font-normal">{equipment.location}</span>
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className="text-right min-w-[120px] bg-blue-100 font-bold">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proposedEquipmentTotalsData.map((row) => (
                          <TableRow key={row.month}>
                            <TableCell className="sticky left-0 bg-white font-medium">{row.month}</TableCell>
                            {proposedEquipment.map((equipment) => {
                              const equipmentName = `${equipment.brand} ${equipment.model}`
                              const value = row[equipmentName] || 0

                              return (
                                <TableCell key={equipment.id} className="text-right bg-blue-50/50">
                                  {currencySymbol}
                                  {value.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-right bg-blue-100 font-bold">
                              {currencySymbol}
                              {(row["Total"] || 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600 text-center">
                Showing complete {analysisYears * 12}-month analysis. Use Export CSV to save separate files for current
                and proposed equipment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
                  label={{ value: `Monthly Cost (${currencySymbol})`, angle: -90, position: "insideLeft" }}
                  tickFormatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels = {
                      current: "Current Equipment",
                      proposed: "Proposed Equipment",
                      savings: "Monthly Savings",
                    }
                    return [
                      `${currencySymbol}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
                <YAxis tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels = {
                      current: "Current Equipment",
                      proposed: "Proposed Equipment",
                      savings: "Annual Savings",
                    }
                    return [
                      `${currencySymbol}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
                  {currencySymbol}
                  {analysisData.totalCurrentCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Proposed Equipment:</span>
                <span className="font-semibold text-blue-600">
                  {currencySymbol}
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
                    {currencySymbol}
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
              {currencySymbol}
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

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
