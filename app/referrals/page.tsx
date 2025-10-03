"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Share2,
  Copy,
  Gift,
  TrendingUp,
  Clock,
  CheckCircle,
  Mail,
  Facebook,
  // Remove Twitter import if there is an X icon instead
  // import XIcon (if available) or use a generic icon
  Linkedin,
  XIcon,
} from "lucide-react"
import {
  generateReferralLink,
  getUserReferralStats,
  getUserReferrals,
  type ReferralStats,
  type Referral,
} from "@/lib/referral-utils"
import { toast } from "@/hooks/use-toast"

export default function ReferralsPage() {
  return (
    <ProtectedRoute>
      <ReferralsContent />
    </ProtectedRoute>
  )
}

function ReferralsContent() {
  const { user } = useAuth()
  const [referralLink, setReferralLink] = useState<string>("")
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user) {
      loadReferralData()
    }
  }, [user])

  const loadReferralData = async () => {
    try {
      // setLoading(true)
      const [link, statsData, referralsData] = await Promise.all([
        generateReferralLink(user!.id),
        getUserReferralStats(user!.id),
        getUserReferrals(user!.id),
      ])

      setReferralLink(link)
      setStats(statsData)
      setReferrals(referralsData)
    } catch (error) {
      console.error("Failed to load referral data:", error)
      toast({
        title: "Error",
        description: "Failed to load referral data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

const copyReferralLink = async () => {
  try {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)

    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    })

    // reset back to "Copy" after 3 seconds
    setTimeout(() => setCopied(false), 3000)
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to copy link. Please try again.",
      variant: "destructive",
    })
  }
}


  const shareViaEmail = () => {
    const subject = "Join me on Upgrr - Equipment Analysis Made Easy"
    const body = `Hi there!\n\nI've been using Upgrr for my equipment upgrade analysis and it's been incredibly helpful. I thought you might find it useful too!\n\nUpgrr helps you:\n• Compare equipment options with detailed financial analysis\n• Generate professional reports for clients\n• Calculate ROI and settlement options\n• Make data-driven equipment decisions\n\nSign up using my referral link and we both get a free month:\n${referralLink}\n\nBest regards!`

    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  const shareOnSocial = (platform: string) => {
    const text = "Check out Upgrr - the best tool for equipment upgrade analysis! Join me and get a free month:"
    const url = referralLink

    const shareUrls = {
      // use X’s share / intent URL format
      x: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    }

    // fallback for legacy “twitter” key
    const key = platform === "twitter" ? "x" : platform

    window.open(shareUrls[key as keyof typeof shareUrls], "_blank", "width=600,height=400")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Completed
          </Badge>
        )
      case "rewarded":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Rewarded
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Program</h1>
        <p className="text-gray-600">Earn free months by referring friends and colleagues to Upgrr</p>
      </div>

      {/* Referral Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalReferrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completedReferrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingReferrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalRewardsEarned || 0}</div>
            <p className="text-xs text-muted-foreground">Free months</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="share" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="share">Share & Earn</TabsTrigger>
          <TabsTrigger value="history">Referral History</TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="space-y-6">
          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                How It Works
              </CardTitle>
              <CardDescription>Earn 1 free month for every successful referral</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Share2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Share Your Link</h3>
                  <p className="text-sm text-gray-600">Share your unique referral link with friends and colleagues</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">2. They Sign Up</h3>
                  <p className="text-sm text-gray-600">Your friend signs up and becomes a paying subscriber</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">3. You Both Benefit</h3>
                  <p className="text-sm text-gray-600">You get 1 free month, they get their first month free too!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Your Link */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>Share this link to start earning rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="font-mono text-sm" />
                <Button onClick={copyReferralLink} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={shareViaEmail} variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button onClick={() => shareOnSocial("x")} variant="outline" size="sm">
                  {/* replace icon with X icon if available */}
                  <img src="/xicon.svg" className="h-4 w-4 mr-2" alt="X" />
                  X
                </Button>
                <Button onClick={() => shareOnSocial("facebook")} variant="outline" size="sm">
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button onClick={() => shareOnSocial("linkedin")} variant="outline" size="sm">
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Referral Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Referral Tips</CardTitle>
              <CardDescription>Maximize your referral success</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Target Equipment Professionals</h4>
                    <p className="text-sm text-gray-600">
                      Sales managers, finance directors, and equipment dealers benefit most from Upgrr
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Share Your Success Stories</h4>
                    <p className="text-sm text-gray-600">
                      Tell them how Upgrr has helped you close deals faster or make better decisions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Offer to Help</h4>
                    <p className="text-sm text-gray-600">
                      Offer to walk them through their first analysis or answer questions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
              <CardDescription>Track your referrals and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
                  <p className="text-gray-600 mb-4">Start sharing your referral link to see your referrals here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{referral.referee_email || "Email not provided"}</p>
                          <p className="text-sm text-gray-600">Referred on {formatDate(referral.created_at)}</p>
                          {referral.completed_at && (
                            <p className="text-sm text-green-600">Completed on {formatDate(referral.completed_at)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(referral.status)}
                        {referral.reward_granted && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Gift className="h-3 w-3 mr-1" />
                            Reward Granted
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
