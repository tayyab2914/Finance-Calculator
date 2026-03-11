"use client"

import type { ReactNode } from "react"

// Subscription removed — passthrough component
export function SubscriptionGuard({ children }: { children: ReactNode }) {
  return <>{children}</>
}
