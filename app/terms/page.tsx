import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              By accessing and using this financial analysis software ("Service"), you accept and agree to be bound by
              the terms and provision of this agreement.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Use License</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Permission is granted to temporarily use the Service for personal or commercial financial analysis
              purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>modify or copy the materials</li>
              <li>use the materials for any commercial purpose or for any public display</li>
              <li>attempt to reverse engineer any software contained in the Service</li>
              <li>remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Data and Privacy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Your privacy is important to us. All financial data and analyses you create are:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Stored securely with industry-standard encryption</li>
              <li>Never shared with third parties without your explicit consent</li>
              <li>Accessible only by you through your authenticated account</li>
              <li>Backed up regularly to prevent data loss</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Financial Analysis Disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              The financial analyses, calculations, and recommendations provided by this Service are for informational
              purposes only and should not be considered as professional financial advice. Users should:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Verify all calculations independently</li>
              <li>Consult with qualified financial professionals before making investment decisions</li>
              <li>Understand that past performance does not guarantee future results</li>
              <li>Consider their own financial situation and risk tolerance</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Accuracy of Materials</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              The materials appearing in the Service could include technical, typographical, or photographic errors. We
              do not warrant that any of the materials are accurate, complete, or current. We may make changes to the
              materials at any time without notice.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Limitations</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              In no event shall our company or its suppliers be liable for any damages (including, without limitation,
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability
              to use the Service, even if we have been notified orally or in writing of the possibility of such damage.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Revisions and Errata</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              The materials appearing in the Service may include technical, typographical, or photographic errors. We
              will not promise that any of the materials are accurate, complete, or current. We may change the materials
              at any time without notice.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Site Terms of Use Modifications</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              We may revise these terms of use at any time without notice. By using this Service, you are agreeing to be
              bound by the then current version of these Terms and Conditions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>If you have any questions about these Terms and Conditions, please contact us at:</p>
            <div className="mt-2">
              <p>Email: support@financialanalysis.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
