"use client"

import useSWR from "swr"
import { useParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

type Profile = {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  job_title: string | null
  company_address: string | null
  company_phone: string | null
  default_discount_rate: number | null
  currency_symbol: string | null
  is_admin: boolean | null
}

type Subscription = {
  id: string
  status: string
  trial_end: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_subscription_id: string | null
} | null

type Analysis = { id: string; title: string; status: string; created_at: string; updated_at: string }
type Referral = {
  id: string
  referrer_id: string
  referee_id: string | null
  referee_email: string | null
  status: string
  reward_granted: boolean
  reward_type: string
  completed_at: string | null
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const userId = params.id
  const { data, mutate } = useSWR<{
    profile: Profile
    subscription: Subscription
    analyses: Analysis[]
    referrals: Referral[]
  }>(`/api/admin/users/${userId}`, fetcher)

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSub, setSavingSub] = useState(false)

  if (!data) return <div className="p-6">Loading...</div>

  const p = data.profile
  const s = data.subscription

  async function saveProfile(formData: FormData) {
    setSavingProfile(true)
    const payload: any = {
      email: formData.get("email"),
      full_name: formData.get("full_name"),
      company_name: formData.get("company_name"),
      job_title: formData.get("job_title"),
      company_address: formData.get("company_address"),
      company_phone: formData.get("company_phone"),
      default_discount_rate: Number(formData.get("default_discount_rate")) || null,
      currency_symbol: formData.get("currency_symbol"),
      is_admin: formData.get("is_admin") === "on",
    }
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSavingProfile(false)
    if (res.ok) mutate()
  }

  async function saveSubscription(formData: FormData) {
    setSavingSub(true)
    const payload: any = {
      status: formData.get("status"),
      trial_end: formData.get("trial_end") || null,
      current_period_start: formData.get("current_period_start") || null,
      current_period_end: formData.get("current_period_end") || null,
      cancel_at_period_end: formData.get("cancel_at_period_end") === "on",
    }
    const res = await fetch(`/api/admin/users/${userId}/subscription`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSavingSub(false)
    if (res.ok) mutate()
  }

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage User</h1>
        <Link href="/admin">
          <Button variant="outline" className="bg-transparent">
            Back to Users
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={(fd) => {
                // no-op
              }}
              onSubmit={(e) => {
                e.preventDefault()
                saveProfile(new FormData(e.currentTarget))
              }}
              className="space-y-3"
            >
              <Input name="email" defaultValue={p.email} placeholder="Email" />
              <Input name="full_name" defaultValue={p.full_name || ""} placeholder="Full name" />
              <Input name="company_name" defaultValue={p.company_name || ""} placeholder="Company" />
              <Input name="job_title" defaultValue={p.job_title || ""} placeholder="Job title" />
              <Input name="company_address" defaultValue={p.company_address || ""} placeholder="Address" />
              <Input name="company_phone" defaultValue={p.company_phone || ""} placeholder="Phone" />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="default_discount_rate"
                  defaultValue={p.default_discount_rate?.toString() || ""}
                  placeholder="Default discount rate"
                />
                <Input name="currency_symbol" defaultValue={p.currency_symbol || ""} placeholder="Currency symbol" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_admin" defaultChecked={!!p.is_admin} />
                Grant admin access
              </label>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveSubscription(new FormData(e.currentTarget))
              }}
              className="space-y-3"
            >
              <Select defaultValue={s?.status || "trialing"} name="status">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {["trialing", "active", "past_due", "canceled", "unpaid", "incomplete", "incomplete_expired"].map(
                    (st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="datetime-local"
                  name="trial_end"
                  defaultValue={s?.trial_end ? new Date(s.trial_end).toISOString().slice(0, 16) : ""}
                />
                <Input
                  type="datetime-local"
                  name="current_period_start"
                  defaultValue={
                    s?.current_period_start ? new Date(s.current_period_start).toISOString().slice(0, 16) : ""
                  }
                />
                <Input
                  type="datetime-local"
                  name="current_period_end"
                  defaultValue={s?.current_period_end ? new Date(s.current_period_end).toISOString().slice(0, 16) : ""}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="cancel_at_period_end" defaultChecked={!!s?.cancel_at_period_end} />
                Cancel at period end
              </label>
              <div className="text-xs text-muted-foreground">
                Stripe subscription ID: {s?.stripe_subscription_id || "-"}
              </div>

              <Button type="submit" disabled={savingSub}>
                {savingSub ? "Saving..." : "Save Subscription"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-left border-b text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.analyses.map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="py-2 pr-4">{a.title}</td>
                    <td className="py-2 pr-4">{a.status}</td>
                    <td className="py-2 pr-4">{new Date(a.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
                {data.analyses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">
                      No analyses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-left border-b text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Referee</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Reward</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-4">{r.referee_email || r.referee_id || "-"}</td>
                    <td className="py-2 pr-4">{r.status}</td>
                    <td className="py-2 pr-4">
                      {r.reward_granted ? `${r.reward_type}` : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="py-2 pr-4">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {data.referrals.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      No referrals found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
