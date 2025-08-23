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
import { getUserAnalyses, deleteAnalysis, type SavedAnalysis } from "@/lib/database"
import { Loader2, Plus, Search, Calendar, Building2, Mail, Trash2, Eye, Filter, SortAsc } from "lucide-react"
import Link from "next/link"

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
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadAnalyses()
  }, [])

  useEffect(() => {
    filterAndSortAnalyses()
  }, [analyses, searchTerm, sortBy])

  const loadAnalyses = async () => {
    try {
      setLoading(true)
      const data = await getUserAnalyses()
      setAnalyses(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load analyses")
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortAnalyses = () => {
    let filtered = [...analyses]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (analysis) =>
          analysis.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          analysis.client_details.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          analysis.client_details.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "company":
          return a.client_details.companyName.localeCompare(b.client_details.companyName)
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
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
            <div className="text-3xl font-bold text-blue-600">{analyses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Last analysis update</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {analyses.length > 0 ? formatDate(analyses[0].updated_at) : "No analyses yet"}
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
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAnalyses.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <div>
                  <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses found</h3>
                  <p className="text-gray-600 mb-4">
                    No analyses match your search criteria. Try adjusting your search terms.
                  </p>
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
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
            <div className="space-y-4">
              {filteredAnalyses.map((analysis) => (
                <div key={analysis.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{analysis.title}</h3>
                        <Badge variant="secondary">{analysis.analysis_settings.analysisYears} years</Badge>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{analysis.client_details.companyName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{analysis.client_details.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Updated: {formatDate(analysis.updated_at)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Equipment:</span> {analysis.current_equipment.length} current,{" "}
                          {analysis.proposed_equipment.length} proposed
                        </div>
                      </div>

                      {analysis.client_details.referenceNumber && (
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">Reference:</span> {analysis.client_details.referenceNumber}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/analysis/${analysis.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        disabled={deletingId === analysis.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingId === analysis.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
