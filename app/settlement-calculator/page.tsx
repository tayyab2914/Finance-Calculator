"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calculator, TrendingUp } from "lucide-react"

interface SettlementData {
  monthlyAmount: number
  escalationPercent: number
  monthsLeft: number
  interestRate: number
}

interface PaymentPeriod {
  startMonth: number
  endMonth: number
  monthlyAmount: number
  escalationLevel: number
  monthCount: number
  totalAmount: number
  presentValue: number
}

export default function SettlementCalculatorPage() {
  const [data, setData] = useState<SettlementData>({
    monthlyAmount: 0,
    escalationPercent: 0,
    monthsLeft: 0,
    interestRate: 0,
  })

  const [result, setResult] = useState<number | null>(null)
  const [paymentPeriods, setPaymentPeriods] = useState<PaymentPeriod[]>([])
  const [allPayments, setAllPayments] = useState<
    Array<{
      month: number
      amount: number
      presentValue: number
      cumulativePV: number
      isEscalation: boolean
      escalationLevel: number
    }>
  >([])

  const calculateEscalation = (month: number, monthsRemaining: number) => {
    let escalationCount = 0
    let escalationApplied = false

    // Calculate escalations based on remaining contract time
    const monthsUntilFirstEscalation = monthsRemaining % 12 === 0 ? 12 : monthsRemaining % 12

    if (month >= monthsUntilFirstEscalation) {
      escalationCount = 1 + Math.floor((month - 1 - monthsUntilFirstEscalation) / 12)
      escalationApplied = (month - 1 - monthsUntilFirstEscalation) % 12 === 0
    }

    return { escalationCount, escalationApplied }
  }

  const calculateSettlement = () => {
    const periods: PaymentPeriod[] = []
    const payments: Array<{
      month: number
      amount: number
      presentValue: number
      cumulativePV: number
      isEscalation: boolean
      escalationLevel: number
    }> = []

    let totalNPV = 0
    let cumulativePV = 0
    let currentPeriodStart = 1
    let currentEscalationLevel = 0

    // Calculate all individual payments
    for (let month = 1; month <= data.monthsLeft; month++) {
      const { escalationCount, escalationApplied } = calculateEscalation(month, data.monthsLeft)

      // Calculate the escalated amount
      const escalatedAmount = data.monthlyAmount * Math.pow(1 + data.escalationPercent / 100, escalationCount)

      // Calculate present value
      const discountFactor = 1 / Math.pow(1 + data.interestRate / 100 / 12, month)
      const presentValue = escalatedAmount * discountFactor

      totalNPV += presentValue
      cumulativePV += presentValue

      payments.push({
        month,
        amount: escalatedAmount,
        presentValue,
        cumulativePV,
        isEscalation: escalationApplied,
        escalationLevel: escalationCount,
      })

      // Check if we need to create a new period
      if (escalationCount !== currentEscalationLevel || month === data.monthsLeft) {
        if (month > currentPeriodStart || month === 1) {
          // Calculate period totals
          const periodPayments = payments.slice(currentPeriodStart - 1, month)
          const periodTotal = periodPayments.reduce((sum, p) => sum + p.amount, 0)
          const periodPV = periodPayments.reduce((sum, p) => sum + p.presentValue, 0)
          const periodAmount = periodPayments[0]?.amount || data.monthlyAmount

          periods.push({
            startMonth: currentPeriodStart,
            endMonth: month === 1 ? 1 : month - (escalationCount !== currentEscalationLevel ? 1 : 0),
            monthlyAmount:
              currentEscalationLevel === 0
                ? data.monthlyAmount
                : data.monthlyAmount * Math.pow(1 + data.escalationPercent / 100, currentEscalationLevel),
            escalationLevel: currentEscalationLevel,
            monthCount:
              month === 1 ? 1 : month - currentPeriodStart - (escalationCount !== currentEscalationLevel ? 1 : 0) + 1,
            totalAmount: periodTotal,
            presentValue: periodPV,
          })

          if (escalationCount !== currentEscalationLevel) {
            currentPeriodStart = month
            currentEscalationLevel = escalationCount
          }
        }
      }
    }

    // Handle the last period if needed
    if (currentPeriodStart <= data.monthsLeft) {
      const lastPeriodPayments = payments.slice(currentPeriodStart - 1)
      if (lastPeriodPayments.length > 0) {
        const periodTotal = lastPeriodPayments.reduce((sum, p) => sum + p.amount, 0)
        const periodPV = lastPeriodPayments.reduce((sum, p) => sum + p.presentValue, 0)

        periods.push({
          startMonth: currentPeriodStart,
          endMonth: data.monthsLeft,
          monthlyAmount: lastPeriodPayments[0].amount,
          escalationLevel: currentEscalationLevel,
          monthCount: lastPeriodPayments.length,
          totalAmount: periodTotal,
          presentValue: periodPV,
        })
      }
    }

    setPaymentPeriods(periods)
    setAllPayments(payments)
    setResult(totalNPV)
  }

  const reset = () => {
    setData({
      monthlyAmount: 0,
      escalationPercent: 0,
      monthsLeft: 0,
      interestRate: 0,
    })
    setResult(null)
    setPaymentPeriods([])
    setAllPayments([])
  }

  const getEscalationsAhead = () => {
    if (data.monthsLeft <= 0) return 0
    const monthsUntilFirstEscalation = data.monthsLeft % 12 === 0 ? 12 : data.monthsLeft % 12
    if (data.monthsLeft <= monthsUntilFirstEscalation) return 0
    return 1 + Math.floor((data.monthsLeft - monthsUntilFirstEscalation - 1) / 12)
  }

  const getMonthsAtCurrentRate = () => {
    if (data.monthsLeft <= 0) return 0
    return data.monthsLeft % 12 === 0 ? 12 : data.monthsLeft % 12
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settlement Calculator</h1>
          <p className="text-gray-600">Calculate early lease settlement amounts with proper escalation timing</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Input Form */}
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

          {/* Results Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Settlement Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              {result !== null ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        ${result.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-sm text-blue-800">Total Settlement Amount</p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600 mb-1">{data.monthsLeft}</div>
                      <p className="text-sm text-gray-600">Remaining Payments</p>
                    </div>

                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 mb-1">{getEscalationsAhead()}</div>
                      <p className="text-sm text-orange-800">Escalations Ahead</p>
                    </div>
                  </div>

              
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Escalation Logic:</h4>
                    <p className="text-sm text-blue-800">
                      {getMonthsAtCurrentRate()} payments at current rate, then escalation every 12 months thereafter.
                      {getEscalationsAhead() > 0 && ` Total escalations: ${getEscalationsAhead()}`}
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

        {/* Complete Payment Schedule */}
        {result !== null && allPayments.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Complete Payment Schedule</CardTitle>
              <p className="text-sm text-gray-600">All {data.monthsLeft} remaining payments with escalation timing</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Month</th>
                      <th className="text-right py-2">Payment Amount</th>
                      <th className="text-right py-2">Present Value</th>
                      <th className="text-right py-2">Cumulative PV</th>
                      <th className="text-center py-2">Escalation Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPayments.map((payment) => (
                      <tr key={payment.month} className={`border-b ${payment.isEscalation ? "bg-orange-50" : ""}`}>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            {payment.month}
                            {payment.isEscalation && <TrendingUp className="w-4 h-4 text-orange-600" />}
                          </div>
                        </td>
                        <td className="text-right py-2">
                          $
                          {payment.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-right py-2">
                          $
                          {payment.presentValue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-right py-2 font-medium">
                          $
                          {payment.cumulativePV.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-center py-2">
                          {payment.escalationLevel > 0 ? (
                            <span className="inline-flex items-center gap-1 text-orange-600">
                              {payment.escalationLevel}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold bg-blue-50">
                      <td className="py-3">Total Settlement</td>
                      <td className="text-right py-3">
                        $
                        {allPayments
                          .reduce((sum, p) => sum + p.amount, 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </td>
                      <td className="text-right py-3 text-blue-600">
                        $
                        {result.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-right py-3"></td>
                      <td className="text-center py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
