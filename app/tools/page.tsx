import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, TrendingUp, DollarSign, FileText, BarChart3, PieChart } from "lucide-react"

export default function ToolsPage() {
  const tools = [
    {
      icon: Calculator,
      title: "ROI Calculator",
      description: "Calculate return on investment for equipment purchases",
      status: "Coming Soon",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: TrendingUp,
      title: "Depreciation Calculator",
      description: "Calculate equipment depreciation over time",
      status: "Coming Soon",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: DollarSign,
      title: "Lease vs Buy Calculator",
      description: "Compare leasing vs purchasing options",
      status: "Coming Soon",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: FileText,
      title: "Cost Per Page Calculator",
      description: "Calculate true cost per page for printing equipment",
      status: "Coming Soon",
      color: "bg-orange-100 text-orange-600",
    },
    {
      icon: BarChart3,
      title: "Budget Forecasting",
      description: "Forecast equipment costs and budgets",
      status: "Coming Soon",
      color: "bg-red-100 text-red-600",
    },
    {
      icon: PieChart,
      title: "Cost Breakdown Analysis",
      description: "Analyze and visualize cost breakdowns",
      status: "Coming Soon",
      color: "bg-indigo-100 text-indigo-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Tools</h1>
          <p className="text-gray-600">Additional calculators and analysis tools for equipment financing</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${tool.color}`}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{tool.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{tool.status}</span>
                  <Button variant="outline" size="sm" disabled>
                    Launch Tool
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* <Card className="mt-12">
          <CardHeader>
            <CardTitle>Request a Tool</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Need a specific financial calculator or analysis tool? Let us know what you'd like to see added to our
              toolkit.
            </p>
            <Button variant="outline">Submit Tool Request</Button>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
