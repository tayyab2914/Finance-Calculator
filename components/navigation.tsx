"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/upgrade-analysis", label: "Upgrade Analysis" },
    { href: "/settlement-calculator", label: "Settlement Calculator" },
    { href: "/tools", label: "Tools" },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl text-blue-600">
            FinAnalysis
          </Link>
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href && "text-blue-600 bg-blue-50",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
