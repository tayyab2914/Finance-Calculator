import type { ClientDetails, Equipment } from "@/app/upgrade-analysis/page"
import type { MonthlyBreakdown } from "@/lib/equipment-calculations"

interface PDFReportData {
  clientDetails: ClientDetails
  currentEquipment: Equipment[]
  proposedEquipment: Equipment[]
  analysisYears: number
  discountRateAnnual: number
  currencySymbol: string
  currentNPV: number
  proposedNPV: number
  npvSavings: number
  totalCurrentCost: number
  totalProposedCost: number
  firstMonthSavings: number
  firstMonthCurrent: number
  firstMonthProposed: number
  paybackPeriodMonths: number | null
  analysisTitle: string
  chartImageUrl?: string
  chartData: Array<{ month: number; current: number; proposed: number; savings: number }>
  currentCashFlows: number[]
  proposedCashFlows: number[]
  allDetails: MonthlyBreakdown[]
}

export function generatePDFReport(data: PDFReportData, includeDetailedTables = false): string {
  const {
    clientDetails,
    currentEquipment,
    proposedEquipment,
    analysisYears,
    discountRateAnnual,
    currencySymbol,
    currentNPV,
    proposedNPV,
    npvSavings,
    totalCurrentCost,
    totalProposedCost,
    firstMonthSavings,
    firstMonthCurrent,
    firstMonthProposed,
    paybackPeriodMonths,
    analysisTitle,
    chartImageUrl,
    chartData,
    currentCashFlows,
    proposedCashFlows,
    allDetails,
  } = data

  const hasSavings = npvSavings >= 0
  const totalMonths = analysisYears * 12
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${Math.abs(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const paybackPeriodText = paybackPeriodMonths
    ? paybackPeriodMonths > 0
      ? `${Math.floor(paybackPeriodMonths / 12)} years and ${paybackPeriodMonths % 12} months`
      : "Immediate"
    : "Not achieved within analysis period"

  // ── SVG Chart Generation ────────────────────────────────────────────────────

  const fmtK = (val: number) => {
    const abs = Math.abs(val)
    if (abs >= 1_000_000) return `${currencySymbol}${(val / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${currencySymbol}${(val / 1_000).toFixed(0)}k`
    return `${currencySymbol}${val.toFixed(0)}`
  }

  // ── Helper: nice tick interval (mirrors Recharts "nice" axis logic) ────────
  const niceNum = (range: number, round: boolean): number => {
    if (range === 0) return 1
    const exp = Math.floor(Math.log10(Math.abs(range)))
    const frac = range / Math.pow(10, exp)
    let nice: number
    if (round) { nice = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10 }
    else        { nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10 }
    return nice * Math.pow(10, exp)
  }

  // ── Helper: monotone cubic bezier — same algorithm as Recharts type="monotone" ──
  const monotoneSpline = (pts: Array<{ x: number; y: number }>): string => {
    if (pts.length < 2) return ""
    if (pts.length === 2)
      return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} L${pts[1].x.toFixed(1)},${pts[1].y.toFixed(1)}`
    const n = pts.length
    const dx = pts.map((_, i) => i < n - 1 ? pts[i + 1].x - pts[i].x : 0)
    const slopes = pts.map((_, i) => i < n - 1 && dx[i] !== 0 ? (pts[i + 1].y - pts[i].y) / dx[i] : 0)
    const tang = new Array(n).fill(0)
    tang[0] = slopes[0]; tang[n - 1] = slopes[n - 2]
    for (let i = 1; i < n - 1; i++) {
      if (slopes[i - 1] * slopes[i] <= 0) { tang[i] = 0; continue }
      tang[i] = (slopes[i - 1] + slopes[i]) / 2
      const a = tang[i] / slopes[i - 1], b = tang[i] / slopes[i]
      if (a * a + b * b > 9) { const tau = 3 / Math.sqrt(a * a + b * b); tang[i] = tau * a * slopes[i - 1] }
    }
    let path = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
    for (let i = 0; i < n - 1; i++) {
      const cp1x = pts[i].x + dx[i] / 3,     cp1y = pts[i].y + tang[i] * dx[i] / 3
      const cp2x = pts[i + 1].x - dx[i] / 3, cp2y = pts[i + 1].y - tang[i + 1] * dx[i] / 3
      path += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${pts[i + 1].x.toFixed(1)},${pts[i + 1].y.toFixed(1)}`
    }
    return path
  }

  // Monthly Cash Flow Line Chart — high-res, matches website Recharts output
  const lineChartSVG = (() => {
    // Large canvas so every data point and label is clearly readable when printed
    const W = 820, H = 420
    const ml = 105, mr = 40, mt = 30, mb = 80
    const pw = W - ml - mr, ph = H - mt - mb

    const allVals = chartData.flatMap(d => [d.current, d.proposed, d.savings])
    const rawMin = Math.min(...allVals, 0)
    const rawMax = Math.max(...allVals, 0)
    const rawRange = rawMax - rawMin || 1

    // Nice tick spacing — gives clean round Y axis values like Recharts
    const tickSpacing = niceNum(rawRange / 4, true)
    const niceMin = Math.floor(rawMin / tickSpacing) * tickSpacing
    const niceMax = Math.ceil(rawMax / tickSpacing) * tickSpacing
    const range = niceMax - niceMin || 1

    const n = chartData.length
    const toX = (month: number) => ml + ((month - 1) / Math.max(n - 1, 1)) * pw
    const toY = (v: number) => mt + ((niceMax - v) / range) * ph

    // Smooth bezier paths matching Recharts type="monotone"
    const makePath = (key: "current" | "proposed" | "savings") =>
      monotoneSpline(chartData.map(d => ({ x: toX(d.month), y: toY(d[key]) })))

    // Dot markers at every data point — Recharts renders these by default on <Line>
    const makeDots = (key: "current" | "proposed" | "savings", color: string) =>
      chartData.map(d =>
        `<circle cx="${toX(d.month).toFixed(1)}" cy="${toY(d[key]).toFixed(1)}" r="2.5" fill="${color}" stroke="#fff" stroke-width="1"/>`
      ).join("")

    // Y ticks — same format as Recharts tickFormatter: `${currencySymbol}${value.toLocaleString()}`
    const yTickVals: number[] = []
    for (let v = niceMin; v <= niceMax + tickSpacing * 0.01; v += tickSpacing) yTickVals.push(v)
    const fmtY = (v: number) => `${currencySymbol}${Math.round(v).toLocaleString("en-US")}`

    const yTicksSVG = yTickVals.map(v => {
      const y = toY(v)
      return `<line x1="${ml}" y1="${y.toFixed(1)}" x2="${ml + pw}" y2="${y.toFixed(1)}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="3 3"/>` +
             `<text x="${(ml - 8).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="#6b7280" font-size="11">${fmtY(v)}</text>`
    }).join("")

    // X ticks: every 5–6 months to match Recharts auto-density (shows ~10 labels across the chart)
    // Recharts with 60 months auto-picks ~every 5 months; we pick interval so we get ~10–12 labels
    const targetLabels = 12
    const rawInterval = Math.max(1, Math.round(n / targetLabels))
    // Round to nearest nice interval: 1, 2, 3, 5, 6, 10, 12
    const niceIntervals = [1, 2, 3, 5, 6, 10, 12]
    const xInterval = niceIntervals.reduce((prev, cur) =>
      Math.abs(cur - rawInterval) < Math.abs(prev - rawInterval) ? cur : prev
    )
    const xTickMonths: number[] = []
    for (let m = 1; m <= n; m++) {
      if (m === 1 || m % xInterval === 0) xTickMonths.push(m)
    }

    const xTicksSVG = xTickMonths.map(m => {
      const x = toX(m)
      return `<line x1="${x.toFixed(1)}" y1="${mt}" x2="${x.toFixed(1)}" y2="${(mt + ph).toFixed(1)}" stroke="#f3f4f6" stroke-width="1" stroke-dasharray="3 3"/>` +
             `<line x1="${x.toFixed(1)}" y1="${(mt + ph).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(mt + ph + 4).toFixed(1)}" stroke="#d1d5db" stroke-width="1"/>` +
             `<text x="${x.toFixed(1)}" y="${(mt + ph + 18).toFixed(1)}" text-anchor="middle" fill="#6b7280" font-size="11">${m}</text>`
    }).join("")

    // Zero line — only when savings go negative
    const zeroLineSVG = rawMin < 0
      ? `<line x1="${ml}" y1="${toY(0).toFixed(1)}" x2="${ml + pw}" y2="${toY(0).toFixed(1)}" stroke="#9ca3af" stroke-width="1"/>`
      : ""

    // Rotated Y-axis label and X-axis label
    const yLabel = `<text transform="rotate(-90)" x="${(-(mt + ph / 2)).toFixed(1)}" y="14" text-anchor="middle" fill="#6b7280" font-size="11">Monthly Cost (${currencySymbol})</text>`
    const xLabel = `<text x="${(ml + pw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" fill="#6b7280" font-size="11">Month</text>`

    // Legend — line + centre dot matching Recharts Legend for LineChart, well spaced
    const legendY = H - 26
    const legendItems = [
      { color: "#ef4444", label: "Current Equipment",  lx: ml },
      { color: "#3b82f6", label: "Proposed Equipment", lx: ml + 175 },
      { color: "#10b981", label: "Monthly Savings",    lx: ml + 355 },
    ]
    const legendSVG = legendItems.map(li =>
      `<line x1="${li.lx}" y1="${legendY}" x2="${li.lx + 22}" y2="${legendY}" stroke="${li.color}" stroke-width="2"/>` +
      `<circle cx="${li.lx + 11}" cy="${legendY}" r="4" fill="${li.color}" stroke="#fff" stroke-width="1"/>` +
      `<text x="${li.lx + 29}" y="${legendY + 4}" fill="#374151" font-size="11">${li.label}</text>`
    ).join("")

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="font-family:Arial,sans-serif">
      <line x1="${ml}" y1="${mt}" x2="${ml}" y2="${mt + ph}" stroke="#d1d5db" stroke-width="1"/>
      <line x1="${ml}" y1="${mt + ph}" x2="${ml + pw}" y2="${mt + ph}" stroke="#d1d5db" stroke-width="1"/>
      ${yTicksSVG}
      ${xTicksSVG}
      ${zeroLineSVG}
      ${yLabel}
      ${xLabel}
      <path d="${makePath("current")}"  fill="none" stroke="#ef4444" stroke-width="2"/>
      <path d="${makePath("proposed")}" fill="none" stroke="#3b82f6" stroke-width="2"/>
      <path d="${makePath("savings")}"  fill="none" stroke="#10b981" stroke-width="2"/>
      ${makeDots("current",  "#ef4444")}
      ${makeDots("proposed", "#3b82f6")}
      ${makeDots("savings",  "#10b981")}
      ${legendSVG}
    </svg>`
  })()

  // Annual Cost Bar Chart
  const barChartSVG = (() => {
    const W = 820, H = 420
    const ml = 105, mr = 40, mt = 30, mb = 80
    const pw = W - ml - mr, ph = H - mt - mb

    const annualData = Array.from({ length: analysisYears }, (_, i) => {
      const s = i * 12, e = s + 12
      const cur = currentCashFlows.slice(s, e).reduce((a, v) => a + v, 0)
      const pro = proposedCashFlows.slice(s, e).reduce((a, v) => a + v, 0)
      return { year: i + 1, current: cur, proposed: pro, savings: cur - pro }
    })

    const allVals = annualData.flatMap(d => [d.current, d.proposed, d.savings])
    const minV = Math.min(...allVals, 0)
    const maxV = Math.max(...allVals, 0)
    const range = maxV - minV || 1

    const toY = (v: number) => mt + ((maxV - v) / range) * ph
    const zeroY = toY(0)
    const groupW = pw / analysisYears
    const bw = Math.max(4, groupW / 5)

    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const v = minV + (range * i) / 4
      return `<line x1="${ml}" y1="${toY(v).toFixed(1)}" x2="${ml + pw}" y2="${toY(v).toFixed(1)}" stroke="#e5e7eb" stroke-width="1"/>
              <text x="${ml - 8}" y="${(toY(v) + 4).toFixed(1)}" text-anchor="end" fill="#6b7280" font-size="11">${fmtK(v)}</text>`
    }).join("")

    const makeBar = (val: number, x: number, color: string) => {
      if (val >= 0) {
        const barH = toY(0) - toY(val)
        return `<rect x="${x.toFixed(1)}" y="${toY(val).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(barH, 1).toFixed(1)}" fill="${color}"/>`
      } else {
        const barH = toY(val) - zeroY
        return `<rect x="${x.toFixed(1)}" y="${zeroY.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(barH, 1).toFixed(1)}" fill="${color}" opacity="0.7"/>`
      }
    }

    const bars = annualData.map((d, i) => {
      const gx = ml + i * groupW + (groupW - bw * 3.6) / 2
      const cx = gx, px = gx + bw * 1.3, sx = gx + bw * 2.6
      const labelX = ml + i * groupW + groupW / 2
      return `${makeBar(d.current, cx, "#ef4444")}${makeBar(d.proposed, px, "#3b82f6")}${makeBar(d.savings, sx, "#10b981")}
              <text x="${labelX.toFixed(1)}" y="${mt + ph + 20}" text-anchor="middle" fill="#6b7280" font-size="11">Yr ${d.year}</text>`
    }).join("")

    const legendY = H - 26
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="font-family:Arial,sans-serif">
      <line x1="${ml}" y1="${mt}" x2="${ml}" y2="${mt + ph}" stroke="#d1d5db" stroke-width="1"/>
      <line x1="${ml}" y1="${zeroY.toFixed(1)}" x2="${ml + pw}" y2="${zeroY.toFixed(1)}" stroke="#d1d5db" stroke-width="1"/>
      ${yTicks}${bars}
      <rect x="${ml}" y="${legendY - 8}" width="14" height="14" fill="#ef4444"/>
      <text x="${ml + 20}" y="${legendY + 4}" fill="#374151" font-size="11">Current Equipment</text>
      <rect x="${ml + 175}" y="${legendY - 8}" width="14" height="14" fill="#3b82f6"/>
      <text x="${ml + 195}" y="${legendY + 4}" fill="#374151" font-size="11">Proposed Equipment</text>
      <rect x="${ml + 355}" y="${legendY - 8}" width="14" height="14" fill="#10b981"/>
      <text x="${ml + 375}" y="${legendY + 4}" fill="#374151" font-size="11">Annual Savings</text>
    </svg>`
  })()

  // ── Helper: two-line component chart (current=red, proposed=blue) ───────────
  const makeComponentChart = (
    currentVals: number[],
    proposedVals: number[],
  ): string => {
    const W = 820, H = 320
    const ml = 105, mr = 40, mt = 30, mb = 70
    const pw = W - ml - mr, ph = H - mt - mb
    const n = currentVals.length
    if (n === 0) return ""

    const allV = [...currentVals, ...proposedVals]
    const rawMin = Math.min(...allV, 0)
    const rawMax = Math.max(...allV, 0)
    const rawRange = rawMax - rawMin || 1
    const tickSpacing = niceNum(rawRange / 5, true)
    const niceMin = Math.floor(rawMin / tickSpacing) * tickSpacing
    const niceMax = Math.ceil(rawMax / tickSpacing) * tickSpacing

    const toX = (m: number) => ml + ((m - 1) / Math.max(n - 1, 1)) * pw
    const toY = (v: number) => mt + ((niceMax - v) / (niceMax - niceMin || 1)) * ph

    const makePath = (vals: number[]) =>
      monotoneSpline(vals.map((v, i) => ({ x: toX(i + 1), y: toY(v) })))
    const makeDots = (vals: number[], color: string) =>
      vals.map((v, i) =>
        `<circle cx="${toX(i + 1).toFixed(1)}" cy="${toY(v).toFixed(1)}" r="2.5" fill="${color}" stroke="#fff" stroke-width="1"/>`
      ).join("")

    const yTickVals: number[] = []
    for (let v = niceMin; v <= niceMax + tickSpacing * 0.01; v += tickSpacing) yTickVals.push(v)
    const yTicksSVG = yTickVals.map(v => {
      const y = toY(v)
      return `<line x1="${ml}" y1="${y.toFixed(1)}" x2="${ml + pw}" y2="${y.toFixed(1)}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="3 3"/>` +
             `<text x="${(ml - 8).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="#6b7280" font-size="11">${fmtK(v)}</text>`
    }).join("")

    const pixelsPerMonth = pw / Math.max(n - 1, 1)
    const xLabelFs = Math.max(6, Math.min(9, Math.floor(pixelsPerMonth * 0.9)))
    const xLabelCenterY = mt + ph + 14
    const xTicksSVG = currentVals.map((_, i) => {
      const x = toX(i + 1)
      return `<line x1="${x.toFixed(1)}" y1="${mt}" x2="${x.toFixed(1)}" y2="${(mt + ph).toFixed(1)}" stroke="#f3f4f6" stroke-width="1" stroke-dasharray="3 3"/>` +
             `<line x1="${x.toFixed(1)}" y1="${(mt + ph).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(mt + ph + 4).toFixed(1)}" stroke="#d1d5db" stroke-width="1"/>` +
             `<text transform="rotate(-90, ${x.toFixed(1)}, ${xLabelCenterY})" x="${x.toFixed(1)}" y="${xLabelCenterY}" text-anchor="middle" fill="#6b7280" font-size="${xLabelFs}">${i + 1}</text>`
    }).join("")

    const zeroLineSVG = rawMin < 0
      ? `<line x1="${ml}" y1="${toY(0).toFixed(1)}" x2="${ml + pw}" y2="${toY(0).toFixed(1)}" stroke="#9ca3af" stroke-width="1"/>`
      : ""

    const legendY = H - 20
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="font-family:Arial,sans-serif">
      <rect width="${W}" height="${H}" fill="#fff"/>
      <line x1="${ml}" y1="${mt}" x2="${ml}" y2="${mt + ph}" stroke="#d1d5db" stroke-width="1"/>
      <line x1="${ml}" y1="${mt + ph}" x2="${ml + pw}" y2="${mt + ph}" stroke="#d1d5db" stroke-width="1"/>
      ${yTicksSVG}${xTicksSVG}${zeroLineSVG}
      <path d="${makePath(currentVals)}" fill="none" stroke="#ef4444" stroke-width="2"/>
      <path d="${makePath(proposedVals)}" fill="none" stroke="#3b82f6" stroke-width="2"/>
      ${makeDots(currentVals, "#ef4444")}${makeDots(proposedVals, "#3b82f6")}
      <line x1="${ml}" y1="${legendY}" x2="${ml + 22}" y2="${legendY}" stroke="#ef4444" stroke-width="2"/>
      <circle cx="${ml + 11}" cy="${legendY}" r="4" fill="#ef4444" stroke="#fff" stroke-width="1"/>
      <text x="${ml + 29}" y="${legendY + 4}" fill="#374151" font-size="11">Current Equipment</text>
      <line x1="${ml + 175}" y1="${legendY}" x2="${ml + 197}" y2="${legendY}" stroke="#3b82f6" stroke-width="2"/>
      <circle cx="${ml + 186}" cy="${legendY}" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1"/>
      <text x="${ml + 204}" y="${legendY + 4}" fill="#374151" font-size="11">Proposed Equipment</text>
    </svg>`
  }

  // ── Aggregate component arrays from allDetails ───────────────────────────────
  const totalMonthsForCharts = analysisYears * 12
  const componentData = Array.from({ length: totalMonthsForCharts }, (_, i) => {
    const month = i + 1
    const cur = allDetails.filter(d => d.equipmentType === "current" && d.month === month)
    const pro = allDetails.filter(d => d.equipmentType === "proposed" && d.month === month)
    return {
      currentLease:  cur.reduce((s, d) => s + d.leaseAmount, 0),
      proposedLease: pro.reduce((s, d) => s + d.leaseAmount, 0),
      currentClicks:  cur.reduce((s, d) => s + d.blackClickCharges + d.colorClickCharges, 0),
      proposedClicks: pro.reduce((s, d) => s + d.blackClickCharges + d.colorClickCharges, 0),
      currentOther:  cur.reduce((s, d) => s + d.tonerCosts + d.otherCosts, 0),
      proposedOther: pro.reduce((s, d) => s + d.tonerCosts + d.otherCosts, 0),
    }
  })

  const leaseChartSVG  = makeComponentChart(
    componentData.map(d => d.currentLease),
    componentData.map(d => d.proposedLease),
  )
  const clicksChartSVG = makeComponentChart(
    componentData.map(d => d.currentClicks),
    componentData.map(d => d.proposedClicks),
  )
  const otherChartSVG  = makeComponentChart(
    componentData.map(d => d.currentOther),
    componentData.map(d => d.proposedOther),
  )

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${analysisTitle} - Financial Analysis Report</title>
  <style>
    @page {
      size: A4;
      /* 18mm top/bottom gives space for header & footer; 15mm left/right for content */
      margin: 18mm 15mm;

      /* ── Header: date left, analysis title right (no @top-center so each box gets 50% width) ── */
      @top-left {
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 8pt;
        color: #6b7280;
        vertical-align: bottom;
        padding-bottom: 3mm;
        border-bottom: 1px solid #e5e7eb;
      }
      @top-right {
        content: "${analysisTitle.replace(/"/g, "'")} - Financial Analysis Report";
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 8pt;
        color: #6b7280;
        text-align: right;
        white-space: nowrap;
        vertical-align: bottom;
        padding-bottom: 3mm;
        border-bottom: 1px solid #e5e7eb;
      }

      /* ── Footer: page number centred ── */
      @bottom-center {
        content: "Page " counter(page);
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 8pt;
        color: #6b7280;
        padding-bottom: 4mm;
        border-top: 1px solid #e5e7eb;
        padding-top: 3mm;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      font-size: 11pt;
      /* @page margin handles top/bottom spacing — no extra body padding needed */
      padding: 0 2mm;
    }

    .report-container {
      max-width: 100%;
    }

    /* Cover/Header Section */
    .report-header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }

    .report-title {
      font-size: 24pt;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 10px;
    }

    .report-subtitle {
      font-size: 14pt;
      color: #6b7280;
      margin-bottom: 5px;
    }

    .report-date {
      font-size: 10pt;
      color: #9ca3af;
    }

    /* Section Headers */
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 16pt;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #d1fae5;
    }

    .subsection-title {
      font-size: 12pt;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      margin-top: 15px;
    }

    /* Executive Summary Box */
    .executive-summary {
      background: ${hasSavings ? "#ecfdf5" : "#fef2f2"};
      border: 2px solid ${hasSavings ? "#10b981" : "#ef4444"};
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }

    .summary-highlight {
      font-size: 28pt;
      font-weight: bold;
      color: ${hasSavings ? "#059669" : "#dc2626"};
      text-align: center;
      margin: 15px 0;
    }

    .summary-text {
      font-size: 12pt;
      text-align: center;
      color: #374151;
      margin-bottom: 10px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: avoid;
    }

    th {
      background: #f3f4f6;
      color: #1f2937;
      font-weight: 600;
      padding: 10px;
      text-align: left;
      border: 1px solid #d1d5db;
      font-size: 10pt;
    }

    td {
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      font-size: 10pt;
    }

    tr:nth-child(even) {
      background: #f9fafb;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    /* Highlight rows */
    .highlight-savings {
      background: #d1fae5 !important;
      font-weight: 600;
    }

    .highlight-cost {
      background: #fee2e2 !important;
      font-weight: 600;
    }

    /* Client Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 15px 0;
    }

    .info-item {
      margin-bottom: 8px;
    }

    .info-label {
      font-weight: 600;
      color: #6b7280;
      font-size: 9pt;
      display: inline-block;
      width: 120px;
    }

    .info-value {
      color: #1f2937;
      font-size: 10pt;
    }

    /* Equipment List */
    .equipment-list {
      list-style: none;
      padding-left: 0;
    }

    .equipment-item {
      padding: 8px 12px;
      margin: 5px 0;
      background: #f9fafb;
      border-left: 3px solid #10b981;
      border-radius: 4px;
      font-size: 10pt;
    }

    .equipment-current {
      border-left-color: #ef4444;
    }

    .equipment-proposed {
      border-left-color: #3b82f6;
    }

    /* Chart placeholder */
    .chart-container {
      text-align: center;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    .chart-container img {
      max-width: 100%;
      height: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    /* Footer */
    .report-footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 9pt;
      color: #9ca3af;
    }

    /* Print specific styles */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Header -->
    <div class="report-header">
      <div class="report-title">${analysisTitle}</div>
      <div class="report-subtitle">Equipment Cost Analysis Report</div>
      <div class="report-date">Generated on ${currentDate}</div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="executive-summary">
        <div class="summary-text">Net Present Value ${hasSavings ? "Savings" : "Additional Cost"}</div>
        <div class="summary-highlight">${formatCurrency(npvSavings)}</div>
        <div class="summary-text">
          ${
            hasSavings
              ? `By upgrading to the proposed equipment, ${clientDetails.companyName} can achieve significant cost savings over the ${analysisYears}-year analysis period.`
              : `The proposed equipment will result in an additional cost compared to maintaining current equipment over the ${analysisYears}-year analysis period.`
          }
        </div>
        
      </div>
    </div>

    <!-- Client Information -->
    <div class="section">
      <div class="section-title">Client Information</div>
      <div class="info-grid">
        <div>
          <div class="info-item">
            <span class="info-label">Company:</span>
            <span class="info-value">${clientDetails.companyName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">${clientDetails.email}</span>
          </div>
          ${
            clientDetails.referenceNumber
              ? `<div class="info-item">
                  <span class="info-label">Reference:</span>
                  <span class="info-value">${clientDetails.referenceNumber}</span>
                </div>`
              : ""
          }
        </div>
        <div>
          ${
            clientDetails.contactPersonName
              ? `<div class="info-item">
                  <span class="info-label">Contact Person:</span>
                  <span class="info-value">${clientDetails.contactPersonName}</span>
                </div>`
              : ""
          }
          ${
            clientDetails.contactNumber
              ? `<div class="info-item">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${clientDetails.contactNumber}</span>
                </div>`
              : ""
          }
          ${
            clientDetails.contactAddress
              ? `<div class="info-item">
                  <span class="info-label">Address:</span>
                  <span class="info-value">${clientDetails.contactAddress}</span>
                </div>`
              : ""
          }
        </div>
      </div>
    </div>

    <!-- Financial Overview -->
    <div class="section">
      <div class="section-title">Financial Overview</div>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th class="text-right">Current Equipment</th>
            <th class="text-right">Proposed Equipment</th>
            <th class="text-right">${hasSavings ? "Savings" : "Additional Cost"}</th>
          </tr>
        </thead>
        <tbody>
          <tr class="${hasSavings ? "highlight-savings" : "highlight-cost"}">
            <td><strong>NPV Total</strong> (${analysisYears} years @ ${discountRateAnnual}%)</td>
            <td class="text-right">${formatCurrency(currentNPV)}</td>
            <td class="text-right">${formatCurrency(proposedNPV)}</td>
            <td class="text-right"><strong>${formatCurrency(npvSavings)}</strong></td>
          </tr>
          <tr>
            <td>Gross Total (Undiscounted)</td>
            <td class="text-right">${formatCurrency(totalCurrentCost)}</td>
            <td class="text-right">${formatCurrency(totalProposedCost)}</td>
            <td class="text-right">${formatCurrency(totalCurrentCost - totalProposedCost)}</td>
          </tr>
          <tr>
            <td>First Month Cost</td>
            <td class="text-right">${formatCurrency(firstMonthCurrent)}</td>
            <td class="text-right">${formatCurrency(firstMonthProposed)}</td>
            <td class="text-right">${formatCurrency(firstMonthSavings)}</td>
          </tr>
         
        </tbody>
      </table>
    </div>

    ${
      chartImageUrl
        ? `<div class="section">
            <div class="section-title">Cash Flow Comparison</div>
            <div class="chart-container">
              <img src="${chartImageUrl}" alt="Cash Flow Chart" />
            </div>
          </div>`
        : ""
    }

    <!-- Methodology -->
    <div class="section page-break">
      <div class="section-title">Methodology</div>
      <p style="margin-bottom: 12px;">
        This analysis compares the total cost of ownership between current and proposed equipment over a ${analysisYears}-year period (${totalMonths} months). 
        The evaluation uses Net Present Value (NPV) methodology to account for the time value of money.
      </p>
      
      <div class="subsection-title">Analysis Parameters</div>
      <ul style="padding-left: 25px; margin-bottom: 12px;">
        <li><strong>Analysis Period:</strong> ${analysisYears} years (${totalMonths} months)</li>
        <li><strong>Discount Rate:</strong> ${discountRateAnnual}% annually</li>
        <li><strong>Currency:</strong> ${currencySymbol}</li>
      </ul>

      <div class="subsection-title">Cost Components</div>
      <p style="margin-bottom: 8px;">The analysis includes all relevant costs:</p>
      <ul style="padding-left: 25px; margin-bottom: 12px;">
        <li>Monthly lease or rental payments</li>
        <li>Per-click charges for black and white printing</li>
        <li>Per-click charges for color printing</li>
        <li>Toner and ink supply costs</li>
        <li>Maintenance and other recurring costs</li>
        <li>Purchase costs (if applicable)</li>
        <li>Cost escalations over time</li>
      </ul>

      <div class="subsection-title">Net Present Value (NPV)</div>
      <p>
        NPV discounts future cash flows to present value, providing an accurate comparison of costs occurring at different times. 
        A positive NPV savings indicates the proposed equipment delivers better value over the analysis period.
      </p>
    </div>

    <!-- Equipment Details -->
    ${
      includeDetailedTables
        ? `
    <div class="section page-break">
      <div class="section-title">Equipment Specifications</div>
      
      <div class="subsection-title">Current Equipment (${currentEquipment.length} units)</div>
      <ul class="equipment-list">
        ${currentEquipment
          .map(
            (eq) => `
          <li class="equipment-item equipment-current">
            <strong>${eq.brand} ${eq.model}</strong> - ${eq.type === "color" ? "Color & Black" : "Black Only"} |
            ${eq.ownership} | Location: ${eq.location}
            ${eq.clickCharges?.black?.monthlyVolume ? `<br/>Black Volume: ${eq.clickCharges.black.monthlyVolume.toLocaleString()}/month` : ""}
            ${eq.clickCharges?.color?.monthlyVolume ? ` | Color Volume: ${eq.clickCharges.color.monthlyVolume.toLocaleString()}/month` : ""}
          </li>
        `,
          )
          .join("")}
      </ul>

      <div class="subsection-title">Proposed Equipment (${proposedEquipment.length} units)</div>
      <ul class="equipment-list">
        ${proposedEquipment
          .map(
            (eq) => `
          <li class="equipment-item equipment-proposed">
            <strong>${eq.brand} ${eq.model}</strong> - ${eq.type === "color" ? "Color & Black" : "Black Only"} |
            ${eq.ownership} | Location: ${eq.location}
            ${eq.clickCharges?.black?.monthlyVolume ? `<br/>Black Volume: ${eq.clickCharges.black.monthlyVolume.toLocaleString()}/month` : ""}
            ${eq.clickCharges?.color?.monthlyVolume ? ` | Color Volume: ${eq.clickCharges.color.monthlyVolume.toLocaleString()}/month` : ""}
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
    `
        : ""
    }

    <!-- Monthly Cash Flow Chart -->
    <div class="section page-break">
      <div class="section-title">Monthly Cash Flow Comparison</div>
      <div class="chart-container">
        ${lineChartSVG}
      </div>
    </div>

    <!-- Annual Cost Chart -->
    <div class="section">
      <div class="section-title">Annual Cost Comparison</div>
      <div class="chart-container">
        ${barChartSVG}
      </div>
    </div>

    <!-- Cash Flow Components -->
    <div class="section page-break">
      <div class="section-title">Lease Cost Comparison (Monthly)</div>
      <div class="chart-container">${leaseChartSVG}</div>
    </div>

    <div class="section">
      <div class="section-title">Click Charges Comparison (Monthly)</div>
      <div class="chart-container">${clicksChartSVG}</div>
    </div>

    <div class="section page-break">
      <div class="section-title">Other Costs Comparison (Monthly)</div>
      <div class="chart-container">${otherChartSVG}</div>
    </div>

    <!-- Recommendation -->
    <div class="section page-break">
      <div class="section-title">Recommendation</div>
      <p style="margin-bottom: 12px;">
        ${
          hasSavings
            ? `Based on this comprehensive financial analysis, we recommend proceeding with the proposed equipment upgrade. 
               The analysis demonstrates a clear financial advantage with NPV savings of <strong>${formatCurrency(npvSavings)}</strong> over ${analysisYears} years.`
            : `Based on this analysis, maintaining the current equipment would be more cost-effective than the proposed upgrade. 
               The proposed equipment would result in an additional cost of <strong>${formatCurrency(Math.abs(npvSavings))}</strong> over ${analysisYears} years.`
        }
      </p>
      <p>
        ${
          hasSavings
            ? `The proposed equipment offers improved efficiency, reduced operating costs, and modern features that justify the investment. `            : `However, if there are qualitative benefits such as improved functionality, reliability, or business requirements that aren't captured 
               in pure financial terms, these should be considered alongside this cost analysis.`
        }
      </p>
    </div>

  </div>

</body>
</html>
  `
}

export function triggerPDFPrint(htmlContent: string) {
  // Create a hidden iframe for printing
  const printFrame = document.createElement("iframe")
  printFrame.style.position = "fixed"
  printFrame.style.right = "0"
  printFrame.style.bottom = "0"
  printFrame.style.width = "0"
  printFrame.style.height = "0"
  printFrame.style.border = "none"
  document.body.appendChild(printFrame)

  // srcdoc keeps the iframe URL as about:blank so the browser's
  // print header won't show the app URL even if headers are enabled
  printFrame.srcdoc = htmlContent

  // Wait for content to load, then print
  printFrame.addEventListener("load", () => {
    setTimeout(() => {
      printFrame.contentWindow?.print()
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(printFrame)
      }, 1000)
    }, 250)
  })
}
