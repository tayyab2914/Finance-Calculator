"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { MessageSquare, Star, Send, History, CheckCircle } from "lucide-react"
import { getUserFeedback, type Feedback } from "@/lib/feedback-utils"
import { toast } from "@/hooks/use-toast"

export default function FeedbackPage() {
  return (
    <ProtectedRoute>
      <FeedbackContent />
    </ProtectedRoute>
  )
}

function FeedbackContent() {
  const { user } = useAuth()
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [feedbackType, setFeedbackType] = useState<Feedback["feedback_type"]>("general")
  const [rating, setRating] = useState<number>(5)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [category, setCategory] = useState("")

  useEffect(() => {
    if (user) {
      loadFeedback()
    }
  }, [user])

  const loadFeedback = async () => {
    try {
      setLoading(true)
      const data = await getUserFeedback(user!.id)
      setFeedback(data)
    } catch (error) {
      console.error("Failed to load feedback:", error)
      toast({
        title: "Error",
        description: "Failed to load feedback history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please provide feedback message.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    const typeLabel = {
      general: "General Feedback",
      feature_request: "Feature Request",
      bug_report: "Bug Report",
      user_experience: "User Experience",
      analysis_specific: "Analysis Specific",
    }[feedbackType]

    const subject = `[Upgrr Feedback] ${title.trim() || typeLabel}`

    const body = [
      `Type: ${typeLabel}`,
      category.trim() ? `Category: ${category.trim()}` : null,
      feedbackType === "user_experience" ? `Rating: ${rating}/5` : null,
      `From: ${user?.email || "Unknown"}`,
      ``,
      `Message:`,
      message.trim(),
    ]
      .filter((line) => line !== null)
      .join("\n")

    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=support@upgrr.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(gmailUrl, "_blank")

    toast({
      title: "Gmail opened!",
      description: "Please send the pre-filled email to submit your feedback.",
    })

    // Reset form
    setTitle("")
    setMessage("")
    setCategory("")
    setRating(5)
    setFeedbackType("general")

    setSubmitting(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            New
          </Badge>
        )
      case "reviewed":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Reviewed
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="default" className="bg-orange-100 text-orange-800">
            In Progress
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Resolved
          </Badge>
        )
      case "closed":
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "general":
        return "General Feedback"
      case "feature_request":
        return "Feature Request"
      case "bug_report":
        return "Bug Report"
      case "user_experience":
        return "User Experience"
      case "analysis_specific":
        return "Analysis Specific"
      default:
        return type
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

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback</h1>
        <p className="text-gray-600">Help us improve Upgrr by sharing your thoughts and suggestions</p>
      </div>

      <Tabs defaultValue="submit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Share Your Feedback
              </CardTitle>
              <CardDescription>
                Your feedback helps us improve Upgrr. We read every submission and use your input to guide our
                development.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitFeedback} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="feedback-type">Feedback Type</Label>
                    <Select
                      value={feedbackType}
                      onValueChange={(value) => setFeedbackType(value as Feedback["feedback_type"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Feedback</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="bug_report">Bug Report</SelectItem>
                        <SelectItem value="user_experience">User Experience</SelectItem>
                        <SelectItem value="analysis_specific">Analysis Specific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {feedbackType === "user_experience" && (
                    <div className="space-y-2">
                      <Label>Overall Rating</Label>
                      <div className="flex items-center gap-2">
                        {renderStars(rating, true, setRating)}
                        <span className="text-sm text-gray-600">({rating}/5)</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of your feedback"
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Dashboard, Analysis, Reports, etc."
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Your Feedback *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please share your detailed feedback, suggestions, or report any issues you've encountered..."
                    rows={6}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Be as specific as possible. Include steps to reproduce if reporting a bug.
                  </p>
                </div>

                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Feedback Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2 text-green-700">What makes great feedback:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Specific examples and use cases</li>
                    <li>• Clear steps to reproduce issues</li>
                    <li>• Constructive suggestions for improvement</li>
                    <li>• Context about your workflow</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">Response times:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Bug reports: 1-2 business days</li>
                    <li>• Feature requests: 3-5 business days</li>
                    <li>• General feedback: 5-7 business days</li>
                    <li>• We read every submission!</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

       
      </Tabs>
    </div>
  )
}
