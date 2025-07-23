export interface CashFlow {
  month: number
  amount: number
}

export function calculateNPV(cashFlows: CashFlow[], discountRate: number): number {
  return cashFlows.reduce((npv, cashFlow) => {
    return npv + cashFlow.amount / Math.pow(1 + discountRate, cashFlow.month)
  }, 0)
}

export function calculateMonthlyGrowthRate(annualGrowthRate: number): number {
  return Math.pow(1 + annualGrowthRate / 100, 1 / 12) - 1
}

export function applyEscalation(baseAmount: number, escalationRate: number, yearsPassed: number): number {
  return baseAmount * Math.pow(1 + escalationRate / 100, yearsPassed)
}

export function calculateClickCharges(
  rate: number,
  volume: number,
  month: number,
  growthRate: number,
  escalationRate: number,
): number {
  const monthlyGrowthRate = calculateMonthlyGrowthRate(growthRate)
  const yearsPassed = Math.floor((month - 1) / 12)

  const adjustedVolume = volume * Math.pow(1 + monthlyGrowthRate, month - 1)
  const adjustedRate = applyEscalation(rate, escalationRate, yearsPassed)

  return adjustedVolume * adjustedRate
}

export function calculateTonerCosts(
  costPerCartridge: number,
  numberOfCartridges: number,
  yieldPerUnit: number,
  volume: number,
  month: number,
  escalationRate: number,
): number {
  const yearsPassed = Math.floor((month - 1) / 12)
  const adjustedCost = applyEscalation(costPerCartridge, escalationRate, yearsPassed)

  const cartridgesNeeded = (volume * numberOfCartridges) / yieldPerUnit
  return cartridgesNeeded * adjustedCost
}
