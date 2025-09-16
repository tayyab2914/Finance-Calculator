import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Upgrr - Equipment Comparison Calculator",
  description: "Compare equipment options, analyze cash flows, and calculate financial metrics with ease.",
  icons: {
    icon: "/favicon.png", // supports .ico, .png, .svg
  },
    generator: 'v0.app'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
