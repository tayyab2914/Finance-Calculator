"use client"

import useSWR from "swr"
import Link from "next/link"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type UserRow = {
  id: string
  email: string
  name: string | null
  company: string | null
  is_admin: boolean
  subscription_status: string | null
  trial_ends_at: string | null
  subscription: {
    id: string
    status: string
    trial_end: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
  } | null
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminHomePage() {
  const { data, error, isLoading } = useSWR<{ users: UserRow[] }>("/api/admin/users", fetcher)
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    if (!data?.users) return []
    const query = q.trim().toLowerCase()
    if (!query) return data.users
    return data.users.filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        (u.name || "").toLowerCase().includes(query) ||
        (u.company || "").toLowerCase().includes(query),
    )
  }, [data, q])

  if (isLoading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">Failed to load users</div>

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Link href="/dashboard">
          <Button variant="outline" className="bg-transparent">
            Back to App
          </Button>
        </Link>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle>Users</CardTitle>
          <div className="flex items-center gap-3">
            <Input placeholder="Search by email, name, or company" value={q} onChange={(e) => setQ(e.target.value)} />
            <span className="text-sm text-muted-foreground">{filtered.length} users</span>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr className="text-muted-foreground">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Company</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Ends</th>
                <th className="py-2 pr-4">Admin</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b hover:bg-muted/30">
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4">{u.name}</td>
                  <td className="py-3 pr-4">{u.company}</td>
                  <td className="py-3 pr-4">
                    {u.subscription?.status ? (
                      <Badge variant={u.subscription.status === "active" ? "default" : "secondary"}>
                        {u.subscription.status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">none</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {u.subscription?.current_period_end
                      ? new Date(u.subscription.current_period_end).toLocaleDateString()
                      : u.trial_ends_at
                        ? new Date(u.trial_ends_at).toLocaleDateString()
                        : "-"}
                  </td>
                  <td className="py-3 pr-4">{u.is_admin ? <Badge>admin</Badge> : "-"}</td>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/users/${u.id}`}>
                      <Button size="sm">Manage</Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  )
}
