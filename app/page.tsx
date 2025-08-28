import Link from "next/link"
import { Calculator, TrendingUp, Wrench } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Equipment upgrade decisions, Simplified</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compare current vs proposed equipment cash flows and calculate financial metrics like NPV, lease
            projections, and cost breakdowns.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Upgrade Analysis</CardTitle>
              <CardDescription>
                Compare current equipment costs with proposed upgrades and calculate NPV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/upgrade-analysis">
                <Button className="w-full">Start Analysis</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Settlement Calculator</CardTitle>
              <CardDescription>Calculate early lease settlement amounts with escalations</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settlement-calculator">
                <Button className="w-full bg-transparent" variant="outline">
                  Calculate Settlement
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Wrench className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Tools</CardTitle>
              <CardDescription>Additional financial tools and calculators</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tools">
                <Button className="w-full bg-transparent" variant="outline">
                  View Tools
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
