export default function Loading() {
  return (
    <div className="max-w-[1280px] mx-auto px-8 py-10">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-[#f5f5f6] rounded" />
            <div className="mt-3 h-3 w-2/3 bg-[#f5f5f6] rounded" />
            <div className="mt-2 h-3 w-1/2 bg-[#f5f5f6] rounded" />
            <div className="mt-2 h-3 w-1/3 bg-[#f5f5f6] rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}