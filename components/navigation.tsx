"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { getUserProfile } from "@/lib/database"
import Image from "next/image"

export function Navigation() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const data = await getUserProfile()
      // Bust cache by adding timestamp
      if (data?.company_logo_url) {
        data.company_logo_url = `${data.company_logo_url}?t=${Date.now()}`
      }
      setProfile(data)
    } catch (error) {
      console.error("Failed to load profile", error)
    }
  }

  const publicNavItems = [
    { href: "/", label: "Home" },
    { href: "/auth/login", label: "Upgrade Analysis" },
    { href: "/settlement-calculator", label: "Settlement Calculator" },
    { href: "/tools", label: "Tools" },
  ]

  const authenticatedNavItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/upgrade-analysis", label: "Upgrade Analysis" },
    { href: "/settlement-calculator", label: "Settlement Calculator" },
    { href: "/tools", label: "Tools" },
  ]

  const navItems = user ? authenticatedNavItems : publicNavItems

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={user ? "/dashboard" : "/"} className="font-bold text-xl text-primary">
            <Image
              src="/logo.png"
              alt="Logo"
              width={150}
              height={40}
            />
          </Link>

          <div className="flex items-center space-x-8">
            <div className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-gray-600 hover:text-black px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href && "text-gray-600 bg-gray-100",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    {profile?.company_logo_url ? (
                      <img
                        src={profile.company_logo_url || "/placeholder.svg"}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="hidden sm:inline">{user.user_metadata?.full_name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/auth/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
