"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MessageSquare, Send, Star } from "lucide-react"
import { submitFeedback, type Feedback } from "@/lib/feedback-utils"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface FeedbackButtonProps {
  analysisId?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function FeedbackButton({ analysisId, variant = "outline", size = "sm", className }: FeedbackButtonProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedbackType, setFeedbackType] = useState<Feedback["feedback_type"]>(
    analysisId ? "analysis_specific" : "general",
  )
  const [rating, setRating] = useState<number>(5)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to submit feedback.",
        variant: "destructive",
      })
      return
    }

    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please provide feedback message.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const feedbackData = {
        feedback_type: feedbackType,
        rating: feedbackType === "user_experience" ? rating : undefined,
        message: message.trim(),
        analysis_id: analysisId,
      }

      await submitFeedback(user.id, feedbackData)

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      })

      // Reset form and close dialog
      setMessage("")
      setRating(5)
      setOpen(false)
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 cursor-pointer ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"
            }`}
            onClick={() => onRatingChange(star)}
          />
        ))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Feedback</DialogTitle>
          <DialogDescription>
            {analysisId
              ? "Share feedback about this analysis or feature request."
              : "Help us improve Upgrr with your feedback."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Type</Label>
            <Select value={feedbackType} onValueChange={(value) => setFeedbackType(value as Feedback["feedback_type"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Feedback</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
                <SelectItem value="user_experience">User Experience</SelectItem>
                {analysisId && <SelectItem value="analysis_specific">Analysis Specific</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {feedbackType === "user_experience" && (
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {renderStars(rating, setRating)}
                <span className="text-sm text-gray-600">({rating}/5)</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Your Feedback</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, suggestions, or report issues..."
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
