"use client"

import useSWR from "swr"
import Link from "next/link"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Calendar, Award } from "lucide-react"

type AnalysisRow = {
  id: string
  title: string
  status: string
  created_at: string
  updated_at: string
  user_id: string
  user_email: string
  user_name: string
  user_company: string
  client_company: string
}

type Stats = {
  total: number
  statusCounts: {
    New: number
    Sent: number
    Approved: number
    Lost: number
  }
  wonPercentage: string
  lostPercentage: string
  periods: {
    today: number
    last7Days: number
    last30Days: number
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminAnalysesPage() {
  const { data, error, isLoading } = useSWR<{ analyses: AnalysisRow[]; stats: Stats }>("/api/admin/analyses", fetcher)
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    if (!data?.analyses) return []
    const query = q.trim().toLowerCase()
    let results = data.analyses

    // Apply status filter
    if (statusFilter !== "all") {
      results = results.filter((a) => a.status === statusFilter)
    }

    if (query) {
      results = results.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.user_email.toLowerCase().includes(query) ||
          a.user_name.toLowerCase().includes(query) ||
          a.user_company.toLowerCase().includes(query) ||
          a.client_company.toLowerCase().includes(query),
      )
    }

    return results
  }, [data, q, statusFilter])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "default"
      case "Sent":
        return "secondary"
      case "Lost":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">Failed to load analyses</div>

  const stats = data?.stats

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Analyses</h1>
        <Link href="/admin">
          <Button variant="outline" className="bg-transparent">
            Back to Admin
          </Button>
        </Link>
      </header>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.periods.last30Days} in last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.wonPercentage}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.statusCounts.Approved} approved / {stats.statusCounts.Lost} lost
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.periods.last7Days}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.periods.today}</div>
              <p className="text-xs text-muted-foreground mt-1">Analyses created</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">New</span>
                <span className="text-2xl font-bold">{stats.statusCounts.New}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Sent</span>
                <span className="text-2xl font-bold">{stats.statusCounts.Sent}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Approved</span>
                <span className="text-2xl font-bold text-green-600">{stats.statusCounts.Approved}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Lost</span>
                <span className="text-2xl font-bold text-red-600">{stats.statusCounts.Lost}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analyses Table */}
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle>All Analyses</CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Input
              placeholder="Search by title, user, email, or company"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">{filtered.length} analyses</span>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr className="text-muted-foreground">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">User Company</th>
                <th className="py-2 pr-4">Client Company</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Updated</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b hover:bg-muted/30">
                  <td className="py-3 pr-4 font-medium">{a.title}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-col">
                      <span className="text-sm">{a.user_name}</span>
                      <span className="text-xs text-muted-foreground">{a.user_email}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">{a.user_company}</td>
                  <td className="py-3 pr-4">{a.client_company}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={getStatusVariant(a.status)}>{a.status}</Badge>
                  </td>
                  <td className="py-3 pr-4">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">{new Date(a.updated_at).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/users/${a.user_id}`}>
                      <Button size="sm" variant="outline">
                        View User
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No analyses match your search.
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
