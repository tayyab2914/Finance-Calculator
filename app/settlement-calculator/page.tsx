"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"

interface SettlementData {
  monthlyAmount: number
  escalationPercent: number
  monthsLeft: number
  interestRate: number
}

export default function SettlementCalculatorPage() {
  const [data, setData] = useState<SettlementData>({
    monthlyAmount: 0,
    escalationPercent: 0,
    monthsLeft: 0,
    interestRate: 0,
  })

  const [result, setResult] = useState<number | null>(null)

  const calculateSettlement = () => {
    let totalPayout = 0
    let currentMonthlyAmount = data.monthlyAmount
    let npv = 0

    for (let month = 1; month <= data.monthsLeft; month++) {
      // Apply escalation every 12 months
      if (month > 1 && (month - 1) % 12 === 0) {
        currentMonthlyAmount *= 1 + data.escalationPercent / 100
      }

      // Calculate the present value of the monthly payment
      const discountFactor = 1 / Math.pow(1 + data.interestRate / 100 / 12, month)
      npv += currentMonthlyAmount * discountFactor
      totalPayout += currentMonthlyAmount
    }

    setResult(npv)
  }

  const reset = () => {
    setData({
      monthlyAmount: 0,
      escalationPercent: 0,
      monthsLeft: 0,
      interestRate: 0,
    })
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settlement Calculator</h1>
          <p className="text-gray-600">Calculate early lease settlement amounts with escalations</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Lease Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="monthlyAmount">Monthly Lease Amount</Label>
                <Input
                  id="monthlyAmount"
                  type="number"
                  value={data.monthlyAmount || ""}
                  onChange={(e) => setData({ ...data, monthlyAmount: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="Enter monthly payment amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="escalationPercent">Annual Escalation %</Label>
                <Input
                  id="escalationPercent"
                  type="number"
                  step="0.1"
                  value={data.escalationPercent || ""}
                  onChange={(e) => setData({ ...data, escalationPercent: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="Enter annual escalation percentage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthsLeft">Months Remaining</Label>
                <Input
                  id="monthsLeft"
                  type="number"
                  value={data.monthsLeft || ""}
                  onChange={(e) => setData({ ...data, monthsLeft: Number.parseInt(e.target.value) || 0 })}
                  placeholder="Enter months remaining on lease"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate %</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.1"
                  value={data.interestRate || ""}
                  onChange={(e) => setData({ ...data, interestRate: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="Enter annual interest rate"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={calculateSettlement}
                  disabled={!data.monthlyAmount || !data.monthsLeft}
                  className="flex-1"
                >
                  Calculate Settlement
                </Button>
                <Button variant="outline" onClick={reset}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settlement Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              {result !== null ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      ${result.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-gray-600">Total Settlement Amount</p>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-gray-900">Calculation Details</h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Monthly Payment:</span>
                        <span>
                          $
                          {data.monthlyAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Months Remaining:</span>
                        <span>{data.monthsLeft}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annual Escalation:</span>
                        <span>{data.escalationPercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest Rate:</span>
                        <span>{data.interestRate}%</span>
                      </div>
                    </div>

                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total Payout Required:</span>
                        <span className="text-blue-600">
                          ${result.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">How it's calculated:</h4>
                    <p className="text-sm text-blue-800">
                      The settlement amount is calculated by summing the Net Present Value (NPV) of all remaining lease
                      payments, applying the annual escalation rate every 12 months and discounting future payments
                      based on the provided interest rate. This gives you the total amount needed to settle the lease
                      early.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter lease details and click "Calculate Settlement" to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {result !== null && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Payment Schedule Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Month</th>
                      <th className="text-right py-2">Payment Amount</th>
                      <th className="text-right py-2">Cumulative Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.min(data.monthsLeft, 12) }, (_, index) => {
                      const month = index + 1
                      const yearsPassed = Math.floor((month - 1) / 12)
                      const currentMonthlyAmount =
                        data.monthlyAmount * Math.pow(1 + data.escalationPercent / 100, yearsPassed)
                      const cumulativeTotal = Array.from({ length: month }, (_, i) => {
                        const monthIndex = i + 1
                        const yearsPassedForMonth = Math.floor((monthIndex - 1) / 12)
                        return data.monthlyAmount * Math.pow(1 + data.escalationPercent / 100, yearsPassedForMonth)
                      }).reduce((sum, payment) => sum + payment, 0)

                      return (
                        <tr key={month} className="border-b">
                          <td className="py-2">{month}</td>
                          <td className="text-right py-2">
                            $
                            {currentMonthlyAmount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="text-right py-2">
                            $
                            {cumulativeTotal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      )
                    })}
                    {data.monthsLeft > 12 && (
                      <tr className="border-b font-medium">
                        <td className="py-2" colSpan={3}>
                          ... {data.monthsLeft - 12} more months
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {data.monthsLeft > 12 && (
                <p className="text-sm text-gray-600 mt-4">
                  Showing first 12 months only. Total settlement covers all {data.monthsLeft} months.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
