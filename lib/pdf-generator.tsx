import type { ClientDetails, Equipment } from "@/app/upgrade-analysis/page"

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

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${analysisTitle} - Financial Analysis Report</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
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
        ${
          hasSavings && paybackPeriodMonths && paybackPeriodMonths > 0
            ? `<div class="summary-text" style="margin-top: 10px;">
                <strong>Payback Period:</strong> ${paybackPeriodText}
              </div>`
            : ""
        }
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
          ${
            paybackPeriodMonths
              ? `<tr>
                  <td>Payback Period</td>
                  <td colspan="3" class="text-center">${paybackPeriodText}</td>
                </tr>`
              : ""
          }
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
            ${eq.blackVolume ? `<br/>Black Volume: ${eq.blackVolume.toLocaleString()}/month` : ""}
            ${eq.colorVolume ? ` | Color Volume: ${eq.colorVolume.toLocaleString()}/month` : ""}
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
            ${eq.blackVolume ? `<br/>Black Volume: ${eq.blackVolume.toLocaleString()}/month` : ""}
            ${eq.colorVolume ? ` | Color Volume: ${eq.colorVolume.toLocaleString()}/month` : ""}
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
    `
        : ""
    }

    <!-- Recommendation -->
    <div class="section">
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
            ? `The proposed equipment offers improved efficiency, reduced operating costs, and modern features that justify the investment. 
               ${paybackPeriodMonths && paybackPeriodMonths > 0 ? `The investment will pay for itself within ${paybackPeriodText}.` : ""}`
            : `However, if there are qualitative benefits such as improved functionality, reliability, or business requirements that aren't captured 
               in pure financial terms, these should be considered alongside this cost analysis.`
        }
      </p>
    </div>

    <!-- Footer -->
    <div class="report-footer">
      <p>This report was generated by Upgrr - Equipment Cost Analysis Tool</p>
      <p>${currentDate}</p>
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

  const printDocument = printFrame.contentWindow?.document
  if (!printDocument) {
    console.error("Could not access print frame document")
    return
  }

  printDocument.open()
  printDocument.write(htmlContent)
  printDocument.close()

  // Wait for content to load, then print
  printFrame.contentWindow?.addEventListener("load", () => {
    setTimeout(() => {
      printFrame.contentWindow?.print()
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(printFrame)
      }, 1000)
    }, 250)
  })
}
