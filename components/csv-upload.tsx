"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, FileText, AlertCircle, CheckCircle } from "lucide-react"
import type { Equipment } from "@/app/upgrade-analysis/page"

interface CSVUploadProps {
  onEquipmentImported: (equipment: Equipment[]) => void
  equipmentType: "current" | "proposed"
}

interface CSVRow {
  [key: string]: string
}

export function CSVUpload({ onEquipmentImported, equipmentType }: CSVUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        brand: "Canon",
        model: "imageRUNNER ADVANCE C5535i",
        location: "Main Office",
        type: "color",
        ownership: "lease",
        copyBasedService: "true",
        monthlyAmount: "450",
        annualEscalation: "3",
        monthsRemaining: "24",
        paymentFrequency: "monthly",
        evergreenRental: "false",
        blackRate: "0.015",
        blackMonthlyVolume: "5000",
        blackGrowthPercent: "2",
        blackEscalationPercent: "3",
        colorRate: "0.08",
        colorMonthlyVolume: "2000",
        colorGrowthPercent: "2",
        colorEscalationPercent: "3",
        cashPrice: equipmentType === "proposed" ? "12500" : "",
        settlement: equipmentType === "proposed" ? "8500" : "",
        savingsPerMonth: equipmentType === "proposed" ? "150" : "",
      },
      {
        brand: "HP",
        model: "LaserJet Enterprise M608dn",
        location: "Branch Office",
        type: "black",
        ownership: "lease",
        copyBasedService: "false",
        monthlyAmount: "180",
        annualEscalation: "2.5",
        monthsRemaining: "18",
        paymentFrequency: "monthly",
        evergreenRental: "true",
        reducedRate: "75",
        blackMonthlyVolume: "3000",
        blackGrowthPercent: "1.5",
        blackCostPerCartridge: "85",
        blackYieldPerUnit: "8800",
        blackCostEscalationPercent: "2",
        cashPrice: equipmentType === "proposed" ? "2800" : "",
        settlement: equipmentType === "proposed" ? "1200" : "",
        savingsPerMonth: equipmentType === "proposed" ? "50" : "",
      },
    ]

    const headers = Object.keys(sampleData[0])
    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) => headers.map((header) => `"${row[header as keyof typeof row]}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sample-${equipmentType}-equipment.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const parseCSV = (csvText: string): CSVRow[] => {
    const lines = csvText.trim().split("\n")
    if (lines.length < 2) throw new Error("CSV must have at least a header row and one data row")

    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())
    const rows: CSVRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim())
      const row: CSVRow = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      rows.push(row)
    }

    return rows
  }

  const convertCSVToEquipment = (rows: CSVRow[]): Equipment[] => {
    return rows.map((row, index) => {
      const equipment: Equipment = {
        id: `csv-${Date.now()}-${index}`,
        brand: row.brand || "",
        model: row.model || "",
        serialNumber: row.serialNumber || "",
        location: row.location || "",
        type: (row.type as "color" | "black") || "color",
        ownership: (row.ownership as "lease" | "cash") || "lease",
        copyBasedService: row.copyBasedService === "true",
      }

      if (equipment.ownership === "lease") {
        equipment.leaseDetails = {
          monthlyAmount: Number.parseFloat(row.monthlyAmount) || 0,
          annualEscalation: Number.parseFloat(row.annualEscalation) || 0,
          monthsRemaining: Number.parseInt(row.monthsRemaining) || 0,
          paymentFrequency: (row.paymentFrequency as "monthly" | "quarterly") || "monthly",
          evergreenRental: row.evergreenRental === "true",
          reducedRate: row.reducedRate ? Number.parseFloat(row.reducedRate) : undefined,
        }
      }

      if (equipment.copyBasedService) {
        equipment.clickCharges = {
          black: {
            rate: Number.parseFloat(row.blackRate) || 0,
            monthlyVolume: Number.parseFloat(row.blackMonthlyVolume) || 0,
            growthPercent: row.blackGrowthPercent || "0",
            escalationPercent: Number.parseFloat(row.blackEscalationPercent) || 0,
          },
        }

        if (equipment.type === "color") {
          equipment.clickCharges.color = {
            rate: Number.parseFloat(row.colorRate) || 0,
            monthlyVolume: Number.parseFloat(row.colorMonthlyVolume) || 0,
            growthPercent: row.colorGrowthPercent || "0",
            escalationPercent: Number.parseFloat(row.colorEscalationPercent) || 0,
          }
        }
      } else {
        equipment.tonerCosts = {
          blackMonthlyVolume: Number.parseFloat(row.blackMonthlyVolume) || 0,
          colorMonthlyVolume: Number.parseFloat(row.colorMonthlyVolume) || 0,
          blackCostPerCartridge: Number.parseFloat(row.blackCostPerCartridge) || 0,
          colorCostPerCartridge: Number.parseFloat(row.colorCostPerCartridge) || 0,
          numberOfColorCartridges: Number.parseInt(row.numberOfColorCartridges) || 3,
          blackYieldPerUnit: Number.parseFloat(row.blackYieldPerUnit) || 0,
          colorYieldPerUnit: Number.parseFloat(row.colorYieldPerUnit) || 0,
          blackVolumeGrowthPercent: row.blackGrowthPercent || "0",
          colorVolumeGrowthPercent: row.colorGrowthPercent || "0",
          blackCostEscalationPercent: Number.parseFloat(row.blackCostEscalationPercent) || 0,
          colorCostEscalationPercent: Number.parseFloat(row.colorCostEscalationPercent) || 0,
        }
      }

      if (equipmentType === "proposed") {
        equipment.cashPrice = row.cashPrice ? Number.parseFloat(row.cashPrice) : undefined
        equipment.settlement = row.settlement ? Number.parseFloat(row.settlement) : undefined
        equipment.savingsPerMonth = row.savingsPerMonth ? Number.parseFloat(row.savingsPerMonth) : undefined
      }

      return equipment
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file")
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const text = await file.text()
      const rows = parseCSV(text)
      const equipment = convertCSVToEquipment(rows)

      onEquipmentImported(equipment)
      setSuccess(`Successfully imported ${equipment.length} equipment record(s)`)

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          CSV Import
        </CardTitle>
        <CardDescription>
          Quickly import multiple equipment records from a CSV file. Download the sample template to see the required
          format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={downloadSampleCSV} className="flex items-center gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Download Sample CSV
          </Button>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {uploading ? "Importing..." : "Import CSV"}
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">CSV Format Requirements:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Required fields: brand, model, location, type, ownership</li>
            <li>Type must be "color" or "black"</li>
            <li>Ownership must be "lease" or "cash"</li>
            <li>copyBasedService must be "true" or "false"</li>
            <li>Numeric fields will be parsed automatically</li>
            <li>Empty cells will use default values</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
