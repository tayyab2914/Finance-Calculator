"use client"

import type React from "react"

// Subscription removed — passthrough component
export function AccessGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
