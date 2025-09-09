import Link from "next/link"
import {
  Calculator,
  TrendingUp,
  Wrench,
  Facebook,
  Linkedin,
  Play,
  CheckCircle,
  Star,
  ArrowRight,
  Users,
  Shield,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in-up">
              🚀 Beta Version - Early Access
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance animate-fade-in-up animation-delay-200">
              Printer Upgrade Decisions, <span className="text-primary animate-float">Simplified</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed animate-fade-in-up animation-delay-400">
              Powerful financial tools that reveal the true cost of upgrading—or not upgrading—digital printing equipment,
              helping users decide with confidence and enabling sales consultants to win more business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up animation-delay-600">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg transform hover:scale-105 transition-all duration-300"
                >
                  Start Free Analysis{" "}
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3 text-lg bg-transparent transform hover:scale-105 transition-all duration-300"
              >
                Watch Demo <Play className="ml-2 w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in-up animation-delay-800">
              <div className="flex items-center gap-2 transform hover:scale-105 transition-transform duration-300">
                <CheckCircle className="w-4 h-4 text-primary" />
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2 transform hover:scale-105 transition-transform duration-300">
                <CheckCircle className="w-4 h-4 text-primary" />
                Instant Results
              </div>
              <div className="flex items-center gap-2 transform hover:scale-105 transition-transform duration-300">
                <CheckCircle className="w-4 h-4 text-primary" />
                Professional Reports
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 animate-fade-in-up">
              Everything You Need to Make Smart Equipment Decisions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              Comprehensive financial analysis tools built for the modern equipment industry
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border-0 bg-card/50 backdrop-blur-sm animate-fade-in-up animation-delay-200 group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-3">Upgrade Analysis</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Compare existing and proposed equipment costs with detailed ROI calculations. Generate professional
                  reports that help close deals faster.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/upgrade-analysis">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transform hover:scale-105 transition-all duration-300">
                    Start Analysis{" "}
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border-0 bg-card/50 backdrop-blur-sm animate-fade-in-up animation-delay-400 group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-3">Settlement Calculator</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Quickly calculate lease settlements with precision. Handle complex scenarios and provide accurate
                  financial projections.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/settlement-calculator">
                  <Button
                    variant="outline"
                    className="w-full border-primary/20 hover:bg-primary/5 bg-transparent transform hover:scale-105 transition-all duration-300"
                  >
                    Calculate Settlement
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border-0 bg-card/50 backdrop-blur-sm animate-fade-in-up animation-delay-600 group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Wrench className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-3">Financial Tools</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Access a comprehensive suite of financial calculators and analysis tools designed specifically for
                  equipment professionals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools">
                  <Button
                    variant="outline"
                    className="w-full border-primary/20 hover:bg-primary/5 bg-transparent transform hover:scale-105 transition-all duration-300"
                  >
                    Explore Tools
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 animate-fade-in-up">
              Why Choose Upgrr?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              Built by industry experts, trusted by professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center animate-fade-in-left animation-delay-200 group">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get instant calculations and generate professional reports in seconds, not hours.
              </p>
            </div>

            <div className="text-center animate-fade-in-up animation-delay-400 group">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Bank-Grade Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your financial data is protected with enterprise-level security and encryption.
              </p>
            </div>

            <div className="text-center animate-fade-in-right animation-delay-600 group">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Expert Support</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get help from our team of financial experts and equipment industry professionals.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 animate-fade-in-up">
              Master Upgrr in Minutes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              Watch our comprehensive tutorials and become an expert in financial analysis
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border-0 bg-card/50 backdrop-blur-sm animate-fade-in-left animation-delay-200 group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-xl mb-3">Getting Started Guide</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Learn the fundamentals of equipment financial analysis and how to navigate Upgrr's interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">Coming Soon</p>
                  </div>
                </div>
                <Button className="w-full bg-transparent" variant="outline" disabled>
                  Watch Introduction
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border-0 bg-card/50 backdrop-blur-sm animate-fade-in-right animation-delay-400 group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-xl mb-3">Advanced Techniques</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Master complex calculations, custom scenarios, and advanced reporting features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">Coming Soon</p>
                  </div>
                </div>
                <Button className="w-full bg-transparent" variant="outline" disabled>
                  Watch Advanced Tutorial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 animate-fade-in-up">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground animate-fade-in-up animation-delay-200">
              See what equipment professionals are saying about Upgrr
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up animation-delay-200">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400 animate-scale-in"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  "Upgrr has revolutionized how we present equipment upgrades to clients. The professional reports help
                  us close deals 40% faster."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3 hover:scale-110 transition-transform duration-300">
                    <span className="text-primary font-semibold">JS</span>
                  </div>
                  <div>
                    <p className="font-semibold">John Smith</p>
                    <p className="text-sm text-muted-foreground">Equipment Sales Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up animation-delay-400">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400 animate-scale-in"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  "The settlement calculator is incredibly accurate and saves us hours of manual calculations. It's
                  become essential to our workflow."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3 hover:scale-110 transition-transform duration-300">
                    <span className="text-primary font-semibold">MJ</span>
                  </div>
                  <div>
                    <p className="font-semibold">Maria Johnson</p>
                    <p className="text-sm text-muted-foreground">Finance Director</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up animation-delay-600">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400 animate-scale-in"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  "Finally, a tool that understands the equipment industry. The ROI analysis features are exactly what
                  we needed."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3 hover:scale-110 transition-transform duration-300">
                    <span className="text-primary font-semibold">RB</span>
                  </div>
                  <div>
                    <p className="font-semibold">Robert Brown</p>
                    <p className="text-sm text-muted-foreground">Business Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6 animate-fade-in-up">
              Ready to Transform Your Equipment Business?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed animate-fade-in-up animation-delay-200">
              Join thousands of equipment professionals who trust Upgrr for their financial analysis needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg transform hover:scale-105 transition-all duration-300 group"
                >
                  Start Your Free Analysis{" "}
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3 text-lg border-primary/20 hover:bg-primary/5 bg-transparent transform hover:scale-105 transition-all duration-300"
              >
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-muted/50 border-t border-border py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2 animate-fade-in-left">
              <h3 className="text-2xl font-bold text-foreground mb-4">Upgrr</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-md">
                Empowering equipment professionals with intelligent financial analysis tools. Make smarter decisions,
                close more deals, and grow your business.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://www.facebook.com/UpGrr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all duration-300 hover:scale-110"
                >
                  <Facebook className="w-5 h-5 text-primary" />
                </a>
                <a
                  href="https://www.linkedin.com/company/upgrr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all duration-300 hover:scale-110"
                >
                  <Linkedin className="w-5 h-5 text-primary" />
                </a>
              </div>
            </div>

            <div className="animate-fade-in-up animation-delay-200">
              <h4 className="font-semibold text-foreground mb-4">Tools</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/upgrade-analysis"
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    Upgrade Analysis
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settlement-calculator"
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    Settlement Calculator
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tools"
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    Financial Tools
                  </Link>
                </li>
              </ul>
            </div>

            <div className="animate-fade-in-right animation-delay-400">
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 animate-fade-in-up animation-delay-600">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">© 2024 Upgrr. All rights reserved.</p>
              <p className="text-muted-foreground text-sm mt-4 md:mt-0">Made with ❤️ for the equipment industry</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
