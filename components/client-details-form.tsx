"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ClientDetails } from "@/app/upgrade-analysis/page"

interface ClientDetailsFormProps {
  details: ClientDetails
  onChange: (details: ClientDetails) => void
}

export function ClientDetailsForm({ details, onChange }: ClientDetailsFormProps) {
  return (
    <div className="space-y-6">
      {/* Required Fields */}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="referenceNumber">Reference Number</Label>
        <Input
          id="referenceNumber"
          value={details.referenceNumber}
          onChange={(e) => onChange({ ...details, referenceNumber: e.target.value })}
          placeholder="Enter reference number (optional)"
        />
      </div>

      {/* Optional Contact Details */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Details</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactPersonName">Contact Person Full Name</Label>
            <Input
              id="contactPersonName"
              value={details.contactPersonName || ""}
              onChange={(e) => onChange({ ...details, contactPersonName: e.target.value })}
              placeholder="Enter contact person name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              type="tel"
              value={details.contactNumber || ""}
              onChange={(e) => onChange({ ...details, contactNumber: e.target.value })}
              placeholder="Enter contact number"
            />
          </div>
        </div>

      
      </div>
    </div>
  )
}
