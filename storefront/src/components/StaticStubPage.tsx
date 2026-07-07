import Link from "next/link"

interface StaticStubPageProps {
  title: string
  /** Short label shown above the heading, e.g. "Customer Policies". */
  section?: string
}

/**
 * Minimal Myntra-styled "Coming soon" stub used for policy/info pages that
 * don't have real content yet (§6.2 of the production-ready plan). Keeps the
 * footer/header links alive so no route returns a raw 404.
 */
export default function StaticStubPage({ title, section }: StaticStubPageProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-[520px]">
        {section && (
          <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#FF3F6C] mb-3">
            {section}
          </p>
        )}
        <h1 className="text-[28px] md:text-[32px] font-bold text-[#282c3f] mb-3">
          {title}
        </h1>
        <p className="text-[15px] text-[#696e79] mb-8">
          Coming soon. We&apos;re putting this together — check back shortly.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#FF3F6C] text-white text-[13px] font-bold uppercase tracking-[0.15em] px-8 py-3 hover:opacity-90 transition-opacity"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}