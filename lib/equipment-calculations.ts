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
 * Get unified volume from equipment (prioritizes click charges, falls back to toner costs)
 */
export function getUnifiedVolume(equipment: Equipment, colorType: "black" | "color"): number {
  if (colorType === "black") {
    return equipment.clickCharges?.black?.monthlyVolume || equipment.tonerCosts?.blackMonthlyVolume || 0
  } else {
    return equipment.clickCharges?.color?.monthlyVolume || equipment.tonerCosts?.colorMonthlyVolume || 0
  }
}

/**
 * Get unified volume growth from equipment (prioritizes click charges, falls back to toner costs)
 */
export function getUnifiedVolumeGrowth(equipment: Equipment, colorType: "black" | "color"): number {
  if (colorType === "black") {
    return equipment.clickCharges?.black?.growthPercent || equipment.tonerCosts?.blackVolumeGrowthPercent || 0
  } else {
    return equipment.clickCharges?.color?.growthPercent || equipment.tonerCosts?.colorVolumeGrowthPercent || 0
  }
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
      escalationCount = 1 + Math.floor((month - 1 - monthsUntilFirstEscalation) / 12)
      escalationApplied = (month - 1 - monthsUntilFirstEscalation) % 12 === 0
    }

    // Check if we're in post-initial period
    if (month > monthsRemaining) {
      isPostInitial = true
      // Continue with the last escalated rate
      if (monthsRemaining > monthsUntilFirstEscalation) {
        escalationCount = Math.max(1, escalationCount)
      }
    }
  } else {
    // For proposed equipment: Escalations occur every 12 months from start
    escalationCount = Math.floor((month - 1) / 12)
    escalationApplied = (month - 1) % 12 === 0 && month !== 1
  }

  // Apply escalations
  let escalatedAmount = calculateEscalationFactor(monthlyAmount, annualEscalation, escalationCount)

  //  Apply evergreen reduction if in post-initial period
  if (isPostInitial && evergreenRental && reducedRate) {
    escalatedAmount = (escalatedAmount * reducedRate) / 100
  }

  return {
    amount: escalatedAmount,
    escalationApplied,
    isPaymentMonth: true,
    isPostInitialPeriod: isPostInitial,
  }
}

/**
 * Calculate click charges for a specific month using unified volume data
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

  const yearsPassed = 1 + Math.floor((month - 1 - monthsUntilFirstEscalation) / 12)
  let blackClickCharges = 0
  let colorClickCharges = 0

  // Black click charges - use unified volume
  if (equipment.clickCharges.black) {
    const { rate, escalationPercent } = equipment.clickCharges.black
    const monthlyVolume = getUnifiedVolume(equipment, "black")
    const growthPercent = getUnifiedVolumeGrowth(equipment, "black")

    // Calculate volume with growth
    const monthlyGrowthRate = calculateMonthlyGrowthRate(growthPercent)
    const adjustedVolume = monthlyVolume * Math.pow(1 + monthlyGrowthRate, month - 1)

    // Calculate rate with escalation
    const adjustedRate = calculateEscalationFactor(rate, escalationPercent || 0, yearsPassed)

    blackClickCharges = adjustedVolume * adjustedRate
  }

  // Color click charges - use unified volume
  if (equipment.type === "color" && equipment.clickCharges.color) {
    const { rate, escalationPercent } = equipment.clickCharges.color
    const monthlyVolume = getUnifiedVolume(equipment, "color")
    const growthPercent = getUnifiedVolumeGrowth(equipment, "color")

    // Calculate volume with growth
    const monthlyGrowthRate = calculateMonthlyGrowthRate(growthPercent)
    const adjustedVolume = monthlyVolume * Math.pow(1 + monthlyGrowthRate, month - 1)

    // Calculate rate with escalation
    const adjustedRate = calculateEscalationFactor(rate, escalationPercent || 0, yearsPassed)

    colorClickCharges = adjustedVolume * adjustedRate
  }

  return { blackClickCharges, colorClickCharges }
}

/**
 * Calculate toner costs for a specific month using unified volume data
 */
export function calculateTonerCosts(equipment: Equipment, month: number): number {
  if (equipment.copyBasedService || !equipment.tonerCosts) {
    return 0
  }

  const yearsPassed = Math.floor((month - 1) / 12)
  const {
    blackCostPerCartridge,
    colorCostPerCartridge,
    numberOfColorCartridges,
    blackYieldPerUnit,
    colorYieldPerUnit,
    blackCostEscalationPercent,
    colorCostEscalationPercent,
    escalationPercent, // Fallback for backward compatibility
  } = equipment.tonerCosts

  let monthlyTonerCost = 0

  // Calculate black toner costs using unified volume
  const blackMonthlyVolume = getUnifiedVolume(equipment, "black")
  const blackVolumeGrowthPercent = getUnifiedVolumeGrowth(equipment, "black")

  if (blackMonthlyVolume && blackCostPerCartridge && blackYieldPerUnit && blackYieldPerUnit > 0) {
    // Apply volume growth
    const monthlyBlackGrowthRate = calculateMonthlyGrowthRate(blackVolumeGrowthPercent)
    const adjustedBlackVolume = blackMonthlyVolume * Math.pow(1 + monthlyBlackGrowthRate, month - 1)

    // Calculate cartridges needed (1 black cartridge assumed)
    const blackCartridgesNeeded = adjustedBlackVolume / blackYieldPerUnit

    // Apply cost escalation
    const blackEscalation = blackCostEscalationPercent || escalationPercent || 0
    const escalatedBlackCost = calculateEscalationFactor(blackCostPerCartridge, blackEscalation, yearsPassed)

    monthlyTonerCost += blackCartridgesNeeded * escalatedBlackCost
  }

  // Calculate color toner costs using unified volume
  if (equipment.type === "color") {
    const colorMonthlyVolume = getUnifiedVolume(equipment, "color")
    const colorVolumeGrowthPercent = getUnifiedVolumeGrowth(equipment, "color")

    if (
      colorMonthlyVolume &&
      numberOfColorCartridges &&
      colorCostPerCartridge &&
      colorYieldPerUnit &&
      colorYieldPerUnit > 0
    ) {
      // Apply volume growth
      const monthlyColorGrowthRate = calculateMonthlyGrowthRate(colorVolumeGrowthPercent)
      const adjustedColorVolume = colorMonthlyVolume * Math.pow(1 + monthlyColorGrowthRate, month - 1)

      // Calculate cartridges needed
      const colorCartridgesNeeded = (adjustedColorVolume * numberOfColorCartridges) / colorYieldPerUnit

      // Apply cost escalation
      const colorEscalation = colorCostEscalationPercent || escalationPercent || 0
      const escalatedColorCost = calculateEscalationFactor(colorCostPerCartridge, colorEscalation, yearsPassed)

      monthlyTonerCost += colorCartridgesNeeded * escalatedColorCost
    }
  }

  // Fallback calculation if volumes are not provided but cartridge data exists
  if (monthlyTonerCost === 0) {
    // Black cartridge fallback (assume 1 black cartridge)
    if (blackCostPerCartridge) {
      const estimatedBlackConsumption = 1 / 12 // Assume 1 cartridge lasts 1 year on average
      const blackEscalation = blackCostEscalationPercent || escalationPercent || 0
      const escalatedBlackCost = calculateEscalationFactor(blackCostPerCartridge, blackEscalation, yearsPassed)
      monthlyTonerCost += estimatedBlackConsumption * escalatedBlackCost
    }

    // Color cartridge fallback
    if (equipment.type === "color" && numberOfColorCartridges && colorCostPerCartridge) {
      const estimatedColorConsumption = numberOfColorCartridges / 12
      const colorEscalation = colorCostEscalationPercent || escalationPercent || 0
      const escalatedColorCost = calculateEscalationFactor(colorCostPerCartridge, colorEscalation, yearsPassed)
      monthlyTonerCost += estimatedColorConsumption * escalatedColorCost
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
 * Calculate unified volume totals for comparison (works for both click charges and toner costs)
 */
export function calculateUnifiedVolumeTotals(equipment: Equipment[]): { black: number; color: number } {
  const totals = { black: 0, color: 0 }

  equipment.forEach((eq) => {
    totals.black += getUnifiedVolume(eq, "black")
    if (eq.type === "color") {
      totals.color += getUnifiedVolume(eq, "color")
    }
  })

  return totals
}

/**
 * Calculate volume totals for comparison (click charges) - kept for backward compatibility
 */
export function calculateVolumeTotals(equipment: Equipment[]): { black: number; color: number } {
  return calculateUnifiedVolumeTotals(equipment)
}

/**
 * Calculate toner volume totals for comparison - kept for backward compatibility
 */
export function calculateTonerVolumeTotals(equipment: Equipment[]): { black: number; color: number } {
  return calculateUnifiedVolumeTotals(equipment)
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
