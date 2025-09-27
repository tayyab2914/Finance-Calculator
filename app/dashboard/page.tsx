"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getUserAnalyses,
  deleteAnalysis,
  duplicateAnalysis,
  updateAnalysisStatus,
  type SavedAnalysis,
} from "@/lib/database"
import { Loader2, Plus, Search, Trash2, Eye, Filter, SortAsc, Copy, Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import { SubscriptionStatus } from "@/components/subscription-status"
import { SubscriptionGuard } from "@/components/subscription-guard"
import { FeedbackButton } from "@/components/feedback-button"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = useState<SavedAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("updated")
  const [statusFilter, setStatusFilter] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  useEffect(() => {
    loadAnalyses()
  }, [statusFilter])

  useEffect(() => {
    filterAndSortAnalyses()
  }, [analyses, searchTerm, sortBy])

  const loadAnalyses = async () => {
    try {
      setLoading(true)
      const data = await getUserAnalyses(undefined, undefined, statusFilter)
      setAnalyses(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load analyses")
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortAnalyses = () => {
    let filtered = [...analyses]

    if (searchTerm) {
      filtered = filtered.filter(
        (analysis) =>
          analysis.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          analysis.client_details.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          analysis.client_details.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "company":
          return a.client_details.companyName.localeCompare(b.client_details.companyName)
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "status":
          return a.status.localeCompare(b.status)
        case "updated":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

    setFilteredAnalyses(filtered)
  }

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm("Are you sure you want to delete this analysis? This action cannot be undone.")) {
      return
    }

    setDeletingId(analysisId)
    try {
      await deleteAnalysis(analysisId)
      setAnalyses((prev) => prev.filter((analysis) => analysis.id !== analysisId))
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete analysis")
    } finally {
      setDeletingId(null)
    }
  }

  const handleDuplicateAnalysis = async (analysisId: string) => {
    setDuplicatingId(analysisId)
    try {
      const duplicatedAnalysis = await duplicateAnalysis(analysisId)
      setAnalyses((prev) => [duplicatedAnalysis, ...prev])
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to duplicate analysis")
    } finally {
      setDuplicatingId(null)
    }
  }

  const handleStatusUpdate = async (analysisId: string, newStatus: "New" | "Sent" | "Approved" | "Lost") => {
    setUpdatingStatusId(analysisId)
    try {
      await updateAnalysisStatus(analysisId, newStatus)
      setAnalyses((prev) =>
        prev.map((analysis) =>
          analysis.id === analysisId
            ? { ...analysis, status: newStatus, updated_at: new Date().toISOString() }
            : analysis,
        ),
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update status")
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "New":
        return "default"
      case "Sent":
        return "secondary"
      case "Approved":
        return "default"
      case "Lost":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "Sent":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "Approved":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "Lost":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return ""
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
      </div>

      <div className="mb-6">
        <SubscriptionStatus />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <SubscriptionGuard>
        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">New Analysis</CardTitle>
              <CardDescription>Start a new equipment upgrade analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/upgrade-analysis">
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Analysis
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Analyses</CardTitle>
              <CardDescription>Your saved analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{analyses.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Refer Friends</CardTitle>
              <CardDescription>Earn free months for referrals</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/referrals">
                <Button className="w-full bg-transparent" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  View Referrals
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Give Feedback</CardTitle>
              <CardDescription>Help us improve Upgrr</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/feedback">
                  <Button className="w-full bg-transparent" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    View Feedback
                  </Button>
                </Link>
                <FeedbackButton variant="outline" size="sm" className="w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analyses List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Saved Analyses</CardTitle>
                <CardDescription>Manage and view your equipment analyses</CardDescription>
              </div>

              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search analyses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SortAsc className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="company">Company A-Z</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAnalyses.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm || statusFilter !== "all" ? (
                  <div>
                    <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses found</h3>
                    <p className="text-gray-600 mb-4">
                      No analyses match your search criteria. Try adjusting your search terms or filters.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => setSearchTerm("")}>
                        Clear Search
                      </Button>
                      <Button variant="outline" onClick={() => setStatusFilter("all")}>
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
                    <p className="text-gray-600 mb-4">Get started by creating your first equipment upgrade analysis.</p>
                    <Link href="/upgrade-analysis">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Analysis
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Analysis Title</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Company</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Email</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-700">Status</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-700">Period</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-700">Current Equip</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-700">Proposed Equip</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Last Updated</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnalyses.map((analysis) => (
                      <tr key={analysis.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate max-w-[200px]" title={analysis.title}>
                              {analysis.title}
                            </span>
                            {analysis.client_details.referenceNumber && (
                              <Badge variant="outline" className="text-xs">
                                {analysis.client_details.referenceNumber}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className="text-gray-900 truncate max-w-[150px] block"
                            title={analysis.client_details.companyName}
                          >
                            {analysis.client_details.companyName}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className="text-gray-600 truncate max-w-[180px] block"
                            title={analysis.client_details.email}
                          >
                            {analysis.client_details.email}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Select
                            value={analysis.status}
                            onValueChange={(value) => handleStatusUpdate(analysis.id, value as any)}
                            disabled={updatingStatusId === analysis.id}
                          >
                            <SelectTrigger
                              className={`w-24 h-7 text-xs border-0 ${getStatusBadgeColor(analysis.status)}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Sent">Sent</SelectItem>
                              <SelectItem value="Approved">Approved</SelectItem>
                              <SelectItem value="Lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant="secondary" className="text-xs">
                            {analysis.analysis_settings.analysisYears}Y
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-medium text-gray-600">{analysis.current_equipment.length}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-medium text-gray-600">
                            {analysis.proposed_equipment.length}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="text-sm text-gray-600">
                            <div>
                              {new Date(analysis.updated_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(analysis.updated_at).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/analysis/${analysis.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 bg-transparent"
                                title="View analysis"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicateAnalysis(analysis.id)}
                              disabled={duplicatingId === analysis.id}
                              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Duplicate analysis"
                            >
                              {duplicatingId === analysis.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAnalysis(analysis.id)}
                              disabled={deletingId === analysis.id}
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete analysis"
                            >
                              {deletingId === analysis.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </SubscriptionGuard>
    </div>
  )
}
