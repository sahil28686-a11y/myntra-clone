"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"

/**
 * Route guard for authenticated /account/* pages (dashboard, orders,
 * order detail, wishlist, addresses). On mount it rehydrates the auth
 * session via the cookie-scoped SDK; if no session exists it redirects
 * to /account (the login page).
 */
export default function AccountGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const loadCustomer = useAuthStore((s) => s.loadCustomer)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let active = true
    async function check() {
      if (!useAuthStore.getState().isAuthenticated) {
        await loadCustomer()
      }
      if (!active) return
      if (!useAuthStore.getState().isAuthenticated) {
        router.replace("/account")
        return
      }
      setChecked(true)
    }
    check()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!checked) {
    return (
      <div className="max-w-container mx-auto px-4 md:px-8 py-12 text-center">
        <p className="text-myntra-muted">Loading...</p>
      </div>
    )
  }

  return <>{children}</>
}