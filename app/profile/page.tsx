"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUserProfile, uploadCompanyLogo } from "@/lib/database"
import { Loader2, User, Upload, Building2 } from "lucide-react"

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}

function ProfileContent() {
  const { user, updateProfile } = useAuth()
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [defaultDiscountRate, setDefaultDiscountRate] = useState(8)
  const [defaultDiscountRateInput, setDefaultDiscountRateInput] = useState("8")
  const [currencySymbol, setCurrencySymbol] = useState("$")
  const [companyLogoUrl, setCompanyLogoUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profile = await getUserProfile()
      setFullName(profile.full_name || "")
      setCompanyName(profile.company_name || "")
      setJobTitle(profile.job_title || "")
      setCompanyAddress(profile.company_address || "")
      setCompanyPhone(profile.company_phone || "")
      setDefaultDiscountRate(profile.default_discount_rate || 8)
      setDefaultDiscountRateInput(String(profile.default_discount_rate || 8))
      setCurrencySymbol(profile.currency_symbol || "$")
      setCompanyLogoUrl(profile.company_logo_url ? `${profile.company_logo_url}?t=${Date.now()}` : "")
      // setCompanyLogoUrl(profile.company_logo_url || "")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await updateProfile({
        fullName,
        companyName,
        jobTitle,
        companyAddress,
        companyPhone,
        defaultDiscountRate,
        currencySymbol,
      })
      setSuccess("Profile updated successfully!")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    setUploadingLogo(true)
    setError(null)

    try {
      const logoUrl = await uploadCompanyLogo(file)
       setCompanyLogoUrl(`${logoUrl}?t=${Date.now()}`)
      // setCompanyLogoUrl(logoUrl)
      setSuccess("Company logo uploaded successfully!")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <User className="w-8 h-8" />
          Profile Settings
        </h1>
        <p className="text-gray-600 mt-2">Manage your account information and preferences.</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Company Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Logo
            </CardTitle>
            <CardDescription>Upload your company logo for reports and branding.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companyLogoUrl && (
                <div className="flex items-center gap-4">
                  <img
                    // src="https://eglsuheshgtkuieitino.supabase.co/storage/v1/object/public/company-logos/a3196fc5-fbfe-4349-905e-a29152e757b4/logo.jpg"
                    src={companyLogoUrl || "/placeholder.svg"}
                    alt="Company Logo"
                    className="w-16 h-16 object-contain border rounded-lg"
                  />
                  <div>
                    <p className="text-sm font-medium">Current Logo</p>
                    <p className="text-xs text-gray-500">Upload a new image to replace</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {companyLogoUrl ? "Replace Logo" : "Upload Logo"}
                </Button>
                <p className="text-sm text-gray-500">Recommended: PNG or JPG, max 5MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details and company information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={user?.email || ""} disabled className="bg-gray-50" />
                  <p className="text-sm text-gray-500">
                    Email address cannot be changed. Contact support if you need to update this.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="Enter your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Enter your job title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Textarea
                  id="companyAddress"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Enter company address"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyPhone">Company Phone</Label>
                <Input
                  id="companyPhone"
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="Enter company phone number"
                />
              </div>


              {/* Report Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Settings</CardTitle>
                  <CardDescription>Configure default settings for your financial reports.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="defaultDiscountRate">Default Discount Rate (%)</Label>
                      <Input
                        id="defaultDiscountRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={defaultDiscountRateInput}
                        onChange={(e) => setDefaultDiscountRateInput(e.target.value)}
                        onBlur={() => {
                          const parsed = parseFloat(defaultDiscountRateInput)
                          if (!isNaN(parsed)) {
                            setDefaultDiscountRate(parsed)
                            setDefaultDiscountRateInput(String(parsed))
                          } else {
                            // fallback if empty or invalid
                            setDefaultDiscountRate(8)
                            setDefaultDiscountRateInput("8")
                          }
                        }}
                        placeholder="8.0"
                      />
                      <p className="text-sm text-gray-500">This rate will be used as default for new analyses</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currencySymbol">Currency Symbol</Label>
                      <Select value={currencySymbol} onValueChange={setCurrencySymbol}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="$">$ (USD)</SelectItem>
                          <SelectItem value="€">€ (EUR)</SelectItem>
                          <SelectItem value="£">£ (GBP)</SelectItem>
                          <SelectItem value="¥">¥ (JPY)</SelectItem>
                          <SelectItem value="₹">₹ (INR)</SelectItem>
                          <SelectItem value="C$">C$ (CAD)</SelectItem>
                          <SelectItem value="A$">A$ (AUD)</SelectItem>
                          <SelectItem value="R">R (ZAR)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">Currency symbol used in reports and analyses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>


        </Card>




        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and statistics.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Account Created:</span>
                <span className="font-medium">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Sign In:</span>
                <span className="font-medium">
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email Verified:</span>
                <span className={`font-medium ${user?.email_confirmed_at ? "text-green-600" : "text-red-600"}`}>
                  {user?.email_confirmed_at ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
