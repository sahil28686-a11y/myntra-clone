export default function Loading() {
  return (
    <div className="min-h-[700px] mt-[80px]">
      <div className="max-w-[1280px] mx-auto px-[30px]">
        <div className="flex flex-col lg:flex-row gap-[30px] pt-[20px] animate-pulse">
          {/* Image gallery skeleton */}
          <div className="lg:w-[55%] flex gap-[10px]">
            <div className="flex flex-col gap-[8px] w-[60px] flex-shrink-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[60px] h-[80px] bg-[#f5f5f6] rounded" />
              ))}
            </div>
            <div className="flex-1 aspect-[3/4] bg-[#f5f5f6] rounded" />
          </div>
          {/* Info skeleton */}
          <div className="lg:w-[45%]">
            <div className="h-4 w-1/3 bg-[#f5f5f6] rounded mb-3" />
            <div className="h-6 w-3/4 bg-[#f5f5f6] rounded mb-4" />
            <div className="h-5 w-1/4 bg-[#f5f5f6] rounded mb-6" />
            <div className="h-12 w-full bg-[#f5f5f6] rounded mb-4" />
            <div className="h-12 w-full bg-[#f5f5f6] rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}