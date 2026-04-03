export function CourseCardSkeleton() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      {/* Shimmer overlay */}
      <div className="animate-shimmer pointer-events-none absolute inset-0 z-10"></div>

      {/* Image placeholder */}
      <div className="skeleton-bg relative aspect-video w-full"></div>

      {/* Content placeholder */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {/* Duration placeholder */}
          <div className="skeleton-bg mb-2 h-4 w-24 rounded-sm"></div>

          {/* Title placeholder */}
          <div className="skeleton-bg mb-2 h-4 w-full rounded-sm"></div>
          <div className="skeleton-bg h-4 w-3/4 rounded-sm"></div>
        </div>

        {/* Buttons placeholder */}
        <div className="mt-4 flex items-center justify-between">
          <div className="skeleton-bg h-8 w-8 rounded-sm"></div>
          <div className="skeleton-bg h-8 w-8 rounded-sm"></div>
        </div>
      </div>
    </div>
  );
}
