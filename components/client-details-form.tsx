"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ClientDetails } from "@/app/upgrade-analysis/page"

interface ClientDetailsFormProps {
  details: ClientDetails
  onChange: (details: ClientDetails) => void
}

export function ClientDetailsForm({ details, onChange }: ClientDetailsFormProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={details.companyName}
          onChange={(e) => onChange({ ...details, companyName: e.target.value })}
          placeholder="Enter company name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={details.email}
          onChange={(e) => onChange({ ...details, email: e.target.value })}
          placeholder="Enter email address"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="referenceNumber">Reference Number</Label>
        <Input
          id="referenceNumber"
          value={details.referenceNumber}
          onChange={(e) => onChange({ ...details, referenceNumber: e.target.value })}
          placeholder="Enter reference number (optional)"
        />
      </div>
    </div>
  )
}
