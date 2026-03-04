export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white flex flex-col h-full w-full relative shadow-sm">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 animate-shimmer z-10 pointer-events-none"></div>

      {/* Image placeholder */}
      <div className="relative aspect-video w-full skeleton-bg"></div>

      {/* Content placeholder */}
      <div className="flex flex-col flex-1 p-4 justify-between">
        <div>
          {/* Duration placeholder */}
          <div className="mb-2 h-4 w-24 skeleton-bg rounded-sm"></div>

          {/* Title placeholder */}
          <div className="h-4 w-full skeleton-bg rounded-sm mb-2"></div>
          <div className="h-4 w-3/4 skeleton-bg rounded-sm"></div>
        </div>

        {/* Buttons placeholder */}
        <div className="flex items-center justify-between mt-4">
          <div className="h-8 w-8 skeleton-bg rounded-sm"></div>
          <div className="h-8 w-8 skeleton-bg rounded-sm"></div>
        </div>
      </div>
    </div>
  )
}
