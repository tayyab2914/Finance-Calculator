import type { Equipment } from "@/app/upgrade-analysis/page"

export interface MonthlyBreakdown {
  month: number
  equipmentId: string
  equipmentName: string
  equipmentType: "current" | "proposed"
  leaseAmount: number
  blackClickCharges: number
  colorClickCharges: number
  tonerCosts: number
  otherCosts: number
  totalMonthlyCost: number
  escalationApplied: boolean
  currentRate: number
  isPaymentMonth: boolean
  isPostInitialPeriod: boolean
}

export interface CashFlowResult {
  cashFlows: number[]
  monthlyBreakdowns: MonthlyBreakdown[]
}

/**
 * Calculate escalation factor based on time passed
 */
export function calculateEscalationFactor(baseRate: number, escalationPercent: number, yearsPassed: number): number {
  return baseRate * Math.pow(1 + escalationPercent / 100, yearsPassed)
}

/**
 * Calculate monthly growth rate from annual growth rate
 */
export function calculateMonthlyGrowthRate(annualGrowthPercent: number): number {
  return Math.pow(1 + annualGrowthPercent / 100, 1 / 12) - 1
}

/**
 * Determine if current month is a payment month based on frequency
 */
export function isPaymentMonth(month: number, frequency: "monthly" | "quarterly"): boolean {
  return frequency === "monthly" || (frequency === "quarterly" && month % 3 === 1)
}

/**
 * Calculate lease payment for a specific month
 */
export function calculateLeasePayment(
  equipment: Equipment,
  month: number,
  equipmentType: "current" | "proposed",
): {
  amount: number
  escalationApplied: boolean
  isPaymentMonth: boolean
  isPostInitialPeriod: boolean
} {
  if (equipment.ownership !== "lease" || !equipment.leaseDetails) {
    return {
      amount: 0,
      escalationApplied: false,
      isPaymentMonth: false,
      isPostInitialPeriod: false,
    }
  }

  const { monthlyAmount, annualEscalation, monthsRemaining, paymentFrequency, evergreenRental, reducedRate } =
    equipment.leaseDetails

  const isPayment = isPaymentMonth(month, paymentFrequency)
  if (!isPayment) {
    return {
      amount: 0,
      escalationApplied: false,
      isPaymentMonth: false,
      isPostInitialPeriod: false,
    }
  }

  let escalationCount = 0
  let escalationApplied = false
  let isPostInitial = false

  if (equipmentType === "current" && monthsRemaining) {
    // For current equipment: Calculate escalations based on remaining contract time
    const monthsUntilFirstEscalation = monthsRemaining % 12 === 0 ? 12 : monthsRemaining % 12

    if (month >= monthsUntilFirstEscalation) {
      escalationCount = 1 + Math.floor((month - 1 -monthsUntilFirstEscalation) / 12)
      escalationApplied = (month - 1 - monthsUntilFirstEscalation) % 12 === 0
    }

    

    // Check if we're in post-initial period
    if (month > monthsRemaining) {
      isPostInitial = true
      // Continue with the last escalated rate
      // escalationCount = Math.floor((monthsRemaining - monthsUntilFirstEscalation - 1) / 12) + 1
      if (monthsRemaining > monthsUntilFirstEscalation) {
        escalationCount = Math.max(1, escalationCount)
      }
    }
  } else {
    // For proposed equipment: Escalations occur every 12 months from start
    escalationCount = Math.floor((month - 1) / 12)
    escalationApplied = (month - 1) % 12 === 0 && month !== 1;
    // if (escalationCount > 0) {
    //   escalationApplied = true
    // }
  }

  // Apply escalations
  let escalatedAmount = calculateEscalationFactor(monthlyAmount, annualEscalation, escalationCount)

  //  Apply evergreen reduction if in post-initial period
  if (isPostInitial && evergreenRental && reducedRate) {
    escalatedAmount = (escalatedAmount * reducedRate) / 100
  }

  // For quarterly payments, multiply by 3
  // if (paymentFrequency === "quarterly") {
  //   escalatedAmount *= 3
  // }

  return {
    amount: escalatedAmount,
    escalationApplied,
    isPaymentMonth: true,
    isPostInitialPeriod: isPostInitial,
  }
}

/**
 * Calculate click charges for a specific month
 */
export function calculateClickCharges(
  equipment: Equipment,
  month: number,
): {
  blackClickCharges: number
  colorClickCharges: number
} {
  if (!equipment.copyBasedService || !equipment.clickCharges) {
    return { blackClickCharges: 0, colorClickCharges: 0 }
  }

  const monthsRemaining = equipment.leaseDetails?.monthsRemaining ?? 0
  const monthsUntilFirstEscalation = monthsRemaining % 12 === 0 ? 12 : monthsRemaining % 12
  

  const yearsPassed = 1 + Math.floor((month - 1 -monthsUntilFirstEscalation) / 12)
  let blackClickCharges = 0
  let colorClickCharges = 0

  // Black click charges
  if (equipment.clickCharges.black) {
    const { rate, monthlyVolume, growthPercent, escalationPercent } = equipment.clickCharges.black

    // Calculate volume with growth
    const monthlyGrowthRate = calculateMonthlyGrowthRate(growthPercent || 0)
    const adjustedVolume = monthlyVolume * Math.pow(1 + monthlyGrowthRate, month - 1)

    // Calculate rate with escalation
    const adjustedRate = calculateEscalationFactor(rate, escalationPercent || 0, yearsPassed)

    blackClickCharges = adjustedVolume * adjustedRate
  }

  // Color click charges
  if (equipment.type === "color" && equipment.clickCharges.color) {
    const { rate, monthlyVolume, growthPercent, escalationPercent } = equipment.clickCharges.color

    // Calculate volume with growth
    const monthlyGrowthRate = calculateMonthlyGrowthRate(growthPercent || 0)
    const adjustedVolume = monthlyVolume * Math.pow(1 + monthlyGrowthRate, month - 1)

    // Calculate rate with escalation
    const adjustedRate = calculateEscalationFactor(rate, escalationPercent || 0, yearsPassed)

    colorClickCharges = adjustedVolume * adjustedRate
  }

  return { blackClickCharges, colorClickCharges }
}

/**
 * Calculate toner costs for a specific month
 */
export function calculateTonerCosts(equipment: Equipment, month: number): number {
  if (equipment.copyBasedService || !equipment.tonerCosts) {
    return 0
  }

  const yearsPassed = Math.floor((month - 1) / 12)
  const { blackCostPerCartridge, colorCostPerCartridge, numberOfCartridges, yieldPerUnit, escalationPercent } =
    equipment.tonerCosts

  let monthlyTonerCost = 0

  // If we have click data, use it to estimate toner consumption
  if (equipment.clickCharges) {
    const totalMonthlyVolume =
      (equipment.clickCharges.black?.monthlyVolume || 0) + (equipment.clickCharges.color?.monthlyVolume || 0)

    if (totalMonthlyVolume > 0 && yieldPerUnit > 0) {
      const cartridgesNeeded = (totalMonthlyVolume * numberOfCartridges) / yieldPerUnit
      const escalatedBlackCost = calculateEscalationFactor(blackCostPerCartridge, escalationPercent, yearsPassed)
      monthlyTonerCost += cartridgesNeeded * escalatedBlackCost

      if (equipment.type === "color" && colorCostPerCartridge) {
        const escalatedColorCost = calculateEscalationFactor(colorCostPerCartridge, escalationPercent, yearsPassed)
        monthlyTonerCost += cartridgesNeeded * escalatedColorCost
      }
    }
  } else {
    // Fallback: Estimate based on average monthly consumption
    const estimatedMonthlyConsumption = numberOfCartridges / 12 // Assume cartridges last 1 year on average
    const escalatedBlackCost = calculateEscalationFactor(blackCostPerCartridge, escalationPercent, yearsPassed)
    monthlyTonerCost += estimatedMonthlyConsumption * escalatedBlackCost

    if (equipment.type === "color" && colorCostPerCartridge) {
      const escalatedColorCost = calculateEscalationFactor(colorCostPerCartridge, escalationPercent, yearsPassed)
      monthlyTonerCost += estimatedMonthlyConsumption * escalatedColorCost
    }
  }

  return monthlyTonerCost
}

/**
 * Calculate other costs (savings) for a specific month
 */
export function calculateOtherCosts(equipment: Equipment): number {
  return equipment.savingsPerMonth ? -equipment.savingsPerMonth : 0 // Negative because it's a saving
}

/**
 * Calculate cash flow for a single equipment over specified months
 */
export function calculateEquipmentCashFlow(
  equipment: Equipment,
  totalMonths: number,
  equipmentType: "current" | "proposed",
): CashFlowResult {
  const cashFlows: number[] = []
  const monthlyBreakdowns: MonthlyBreakdown[] = []

  for (let month = 1; month <= totalMonths; month++) {

    if (equipment.leaseDetails?.paymentFrequency === "quarterly" && (month - 1) % 3 !== 0) {
      continue; // skip non-quarterly months
    }
    // Calculate lease payment
    const leaseResult = calculateLeasePayment(equipment, month, equipmentType)

    // Calculate click charges
    const clickResult = calculateClickCharges(equipment, month)

    // Calculate toner costs
    const tonerCosts = calculateTonerCosts(equipment, month)

    // Calculate other costs (savings)
    const otherCosts = calculateOtherCosts(equipment)

    // Calculate total monthly cost
    const totalMonthlyCost =
      leaseResult.amount + clickResult.blackClickCharges + clickResult.colorClickCharges + tonerCosts + otherCosts

    cashFlows.push(totalMonthlyCost)

    monthlyBreakdowns.push({
      month,
      equipmentId: equipment.id,
      equipmentName: `${equipment.brand} ${equipment.model} (${equipment.location})`,
      equipmentType,
      leaseAmount: leaseResult.amount,
      blackClickCharges: clickResult.blackClickCharges,
      colorClickCharges: clickResult.colorClickCharges,
      tonerCosts,
      otherCosts,
      totalMonthlyCost,
      escalationApplied: leaseResult.escalationApplied,
      currentRate: leaseResult.amount,
      isPaymentMonth: leaseResult.isPaymentMonth,
      isPostInitialPeriod: leaseResult.isPostInitialPeriod,
    })
  }

  return { cashFlows, monthlyBreakdowns }
}

/**
 * Calculate NPV from cash flows
 */
export function calculateNPV(cashFlows: number[], monthlyDiscountRate: number): number {
  return cashFlows.reduce((npv, cashFlow, index) => {
    return npv + cashFlow / Math.pow(1 + monthlyDiscountRate, index + 1)
  }, 0)
}

/**
 * Calculate payback period in months
 */
export function calculatePaybackPeriod(savingsFlows: number[]): number | null {
  let cumulativeSavings = 0
  for (let i = 0; i < savingsFlows.length; i++) {
    cumulativeSavings += savingsFlows[i]
    if (cumulativeSavings > 0) {
      return i + 1
    }
  }
  return null // No payback within analysis period
}

/**
 * Calculate volume totals for comparison
 */
export function calculateVolumeTotals(equipment: Equipment[]): { black: number; color: number } {
  const totals = { black: 0, color: 0 }

  equipment.forEach((eq) => {
    if (eq.copyBasedService && eq.clickCharges) {
      totals.black += eq.clickCharges.black?.monthlyVolume || 0
      if (eq.type === "color" && eq.clickCharges.color) {
        totals.color += eq.clickCharges.color.monthlyVolume || 0
      }
    }
  })

  return totals
}

/**
 * Aggregate cash flows from multiple equipment
 */
export function aggregateEquipmentCashFlows(
  equipmentList: Equipment[],
  totalMonths: number,
  equipmentType: "current" | "proposed",
): {
  totalCashFlows: number[]
  allBreakdowns: MonthlyBreakdown[]
} {
  const totalCashFlows = Array(totalMonths).fill(0)
  const allBreakdowns: MonthlyBreakdown[] = []

  equipmentList.forEach((equipment) => {
    const { cashFlows, monthlyBreakdowns } = calculateEquipmentCashFlow(equipment, totalMonths, equipmentType)

    // Add to total cash flows
    cashFlows.forEach((flow, index) => {
      totalCashFlows[index] += flow
    })

    // Add to all breakdowns
    allBreakdowns.push(...monthlyBreakdowns)
  })

  return { totalCashFlows, allBreakdowns }
}

/**
 * Calculate annual totals from monthly data
 */
export function calculateAnnualTotals(monthlyData: number[], years: number): Array<{ year: number; total: number }> {
  const annualTotals: Array<{ year: number; total: number }> = []

  for (let year = 1; year <= years; year++) {
    const startMonth = (year - 1) * 12
    const endMonth = year * 12
    const yearTotal = monthlyData.slice(startMonth, endMonth).reduce((sum, value) => sum + value, 0)

    annualTotals.push({
      year,
      total: yearTotal,
    })
  }

  return annualTotals
}
