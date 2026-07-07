import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-[520px]">
        <p className="text-[64px] md:text-[80px] font-bold text-[#FF3F6C] leading-none mb-2">
          404
        </p>
        <h1 className="text-[24px] md:text-[28px] font-bold text-[#282c3f] mb-3">
          Page not found
        </h1>
        <p className="text-[15px] text-[#696e79] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#FF3F6C] text-white text-[13px] font-bold uppercase tracking-[0.15em] px-8 py-3 hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}