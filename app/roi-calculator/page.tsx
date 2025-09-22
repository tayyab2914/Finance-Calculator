"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Building, User, Info } from "lucide-react"

interface CompanyROIData {
  avgGrossProfit: number
  expectedExtraDeals: number
  subscriptionCost: number
}

interface SalesROIData {
  avgCommission: number
  expectedExtraDeals: number
  subscriptionCost: number
}

export default function ROICalculatorPage() {
  const [calculationType, setCalculationType] = useState<"company" | "sales">("company")

  const [companyData, setCompanyData] = useState<CompanyROIData>({
    avgGrossProfit: 0,
    expectedExtraDeals: 0,
    subscriptionCost: 0,
  })

  const [salesData, setSalesData] = useState<SalesROIData>({
    avgCommission: 0,
    expectedExtraDeals: 0,
    subscriptionCost: 0,
  })

  const [companyROI, setCompanyROI] = useState<number | null>(null)
  const [salesROI, setSalesROI] = useState<number | null>(null)

  const calculateCompanyROI = () => {
    const additionalAnnualGP = companyData.avgGrossProfit * companyData.expectedExtraDeals
    const roi = (additionalAnnualGP / companyData.subscriptionCost) * 100
    setCompanyROI(roi)
  }

  const calculateSalesROI = () => {
    const additionalAnnualCommission = salesData.avgCommission * salesData.expectedExtraDeals
    const roi = (additionalAnnualCommission / salesData.subscriptionCost) * 100
    setSalesROI(roi)
  }

  const reset = () => {
    setCompanyData({
      avgGrossProfit: 0,
      expectedExtraDeals: 0,
      subscriptionCost: 0,
    })
    setSalesData({
      avgCommission: 0,
      expectedExtraDeals: 0,
      subscriptionCost: 0,
    })
    setCompanyROI(null)
    setSalesROI(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ROI Calculator</h1>
          <p className="text-gray-600">Calculate your return on investment for Upgrr subscription</p>
        </div>

        {/* Calculation Type Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ROI Calculation Type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={calculationType}
              onValueChange={(value: "company" | "sales") => setCalculationType(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Company Level ROI
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sales" id="sales" />
                <Label htmlFor="sales" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Sales Professional Level ROI
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {calculationType === "company" ? (
                  <>
                    <Building className="w-5 h-5" />
                    Company ROI Inputs
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    Sales Professional ROI Inputs
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {calculationType === "company" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="avgGrossProfit">Average Gross Profit per Transaction</Label>
                    <Input
                      id="avgGrossProfit"
                      type="number"
                      value={companyData.avgGrossProfit || ""}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, avgGrossProfit: Number.parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Enter average gross profit"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedExtraDeals">Expected Extra Deals Closed (Annual)</Label>
                    <Input
                      id="expectedExtraDeals"
                      type="number"
                      value={companyData.expectedExtraDeals || ""}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, expectedExtraDeals: Number.parseInt(e.target.value) || 0 })
                      }
                      placeholder="Enter expected additional deals"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subscriptionCost">Annual Subscription Cost</Label>
                    <Input
                      id="subscriptionCost"
                      type="number"
                      value={companyData.subscriptionCost || ""}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, subscriptionCost: Number.parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Enter annual subscription cost"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={calculateCompanyROI}
                      disabled={
                        !companyData.avgGrossProfit || !companyData.expectedExtraDeals || !companyData.subscriptionCost
                      }
                      className="flex-1"
                    >
                      Calculate Company ROI
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      Reset
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="avgCommission">Average Commission per Transaction</Label>
                    <Input
                      id="avgCommission"
                      type="number"
                      value={salesData.avgCommission || ""}
                      onChange={(e) =>
                        setSalesData({ ...salesData, avgCommission: Number.parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Enter average commission"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedExtraDeals">Expected Extra Deals Closed (Annual)</Label>
                    <Input
                      id="expectedExtraDeals"
                      type="number"
                      value={salesData.expectedExtraDeals || ""}
                      onChange={(e) =>
                        setSalesData({ ...salesData, expectedExtraDeals: Number.parseInt(e.target.value) || 0 })
                      }
                      placeholder="Enter expected additional deals"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subscriptionCost">Annual Subscription Cost</Label>
                    <Input
                      id="subscriptionCost"
                      type="number"
                      value={salesData.subscriptionCost || ""}
                      onChange={(e) =>
                        setSalesData({ ...salesData, subscriptionCost: Number.parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Enter annual subscription cost"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={calculateSalesROI}
                      disabled={
                        !salesData.avgCommission || !salesData.expectedExtraDeals || !salesData.subscriptionCost
                      }
                      className="flex-1"
                    >
                      Calculate Sales ROI
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      Reset
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>ROI Calculation Results</CardTitle>
            </CardHeader>
            <CardContent>
              {calculationType === "company" ? (
                companyROI !== null ? (
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <div className="text-4xl font-bold text-green-600 mb-2">{companyROI.toFixed(0)}%</div>
                      <p className="text-lg text-green-800 mb-4">Company Level ROI</p>
                      <p className="text-sm text-green-700">
                        Return on Investment based on additional gross profit from extra deals closed
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          ${(companyData.avgGrossProfit * companyData.expectedExtraDeals).toLocaleString("en-US")}
                        </div>
                        <p className="text-sm text-blue-800">Additional Annual GP</p>
                      </div>

                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 mb-1">{companyData.expectedExtraDeals}</div>
                        <p className="text-sm text-purple-800">Extra Deals Annually</p>
                      </div>

                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                          ${companyData.subscriptionCost.toLocaleString("en-US")}
                        </div>
                        <p className="text-sm text-orange-800">Annual Investment</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Enter company details and click "Calculate Company ROI" to see results</p>
                  </div>
                )
              ) : salesROI !== null ? (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-4xl font-bold text-green-600 mb-2">{salesROI.toFixed(0)}%</div>
                    <p className="text-lg text-green-800 mb-4">Sales Professional ROI</p>
                    <p className="text-sm text-green-700">
                      Return on Investment based on additional commission from extra deals closed
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        ${(salesData.avgCommission * salesData.expectedExtraDeals).toLocaleString("en-US")}
                      </div>
                      <p className="text-sm text-blue-800">Additional Annual Commission</p>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-1">{salesData.expectedExtraDeals}</div>
                      <p className="text-sm text-purple-800">Extra Deals Annually</p>
                    </div>

                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        ${salesData.subscriptionCost.toLocaleString("en-US")}
                      </div>
                      <p className="text-sm text-orange-800">Annual Investment</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter sales professional details and click "Calculate Sales ROI" to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Important Note */}
        <Card className="mt-8 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">Important Note</h4>
                <p className="text-amber-700 text-sm leading-relaxed">
                  This ROI calculation excludes intangible benefits such as enhanced professionalism, improved pricing
                  power, and tax-deductibility of the subscription cost. The actual value delivered by Upgrr may be
                  significantly higher when these factors are considered.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
