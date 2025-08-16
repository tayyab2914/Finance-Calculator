"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUserAnalyses, deleteAnalysis, type SavedAnalysis } from "@/lib/database"
import { Plus, FileText, Calendar, Trash2, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadAnalyses()
  }, [])

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

  const handleDelete = async (analysisId: string) => {
    if (!confirm("Are you sure you want to delete this analysis?")) {
      return
    }

    try {
      setDeletingId(analysisId)
      await deleteAnalysis(analysisId)
      setAnalyses(analyses.filter((a) => a.id !== analysisId))
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
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.user_metadata?.full_name || user?.email}!
        </h1>
        <p className="text-gray-600 mt-2">Manage your equipment analyses and create new comparisons.</p>
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
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Analysis
            </CardTitle>
            <CardDescription>Create a new equipment cost comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/upgrade-analysis">
              <Button className="w-full">Start Analysis</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Total Analyses
            </CardTitle>
            <CardDescription>Your saved analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{analyses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Last analysis created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {analyses.length > 0 ? formatDate(analyses[0].created_at) : "No analyses yet"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saved Analyses */}
      <Card>
        <CardHeader>
          <CardTitle>Your Analyses</CardTitle>
          <CardDescription>View, edit, or delete your saved equipment analyses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
              <p className="text-gray-600 mb-4">Create your first equipment analysis to get started.</p>
              <Link href="/upgrade-analysis">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Analysis
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div key={analysis.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{analysis.title}</h3>
                      <p className="text-gray-600 mt-1">{analysis.client_details.companyName}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Current: {analysis.current_equipment.length} equipment</span>
                        <span>Proposed: {analysis.proposed_equipment.length} equipment</span>
                        <span>{analysis.analysis_settings.analysisYears} year analysis</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline">Created {formatDate(analysis.created_at)}</Badge>
                        {analysis.updated_at !== analysis.created_at && (
                          <Badge variant="outline">Updated {formatDate(analysis.updated_at)}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/analysis/${analysis.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(analysis.id)}
                        disabled={deletingId === analysis.id}
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
