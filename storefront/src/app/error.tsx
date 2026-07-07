"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled storefront error:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-[520px]">
        <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#FF3F6C] mb-3">
          Something went wrong
        </p>
        <h1 className="text-[24px] md:text-[28px] font-bold text-[#282c3f] mb-3">
          We hit a snag loading this page
        </h1>
        <p className="text-[15px] text-[#696e79] mb-8">
          Please try again. If the problem persists, head back to the home page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-[#FF3F6C] text-white text-[13px] font-bold uppercase tracking-[0.15em] px-8 py-3 hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border border-[#d4d5d9] text-[#282c3f] text-[13px] font-bold uppercase tracking-[0.15em] px-8 py-3 hover:border-[#282c3f] transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}