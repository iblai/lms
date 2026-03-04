export function SkillsSkeleton() {
  return (
    <div className="mb-4 rounded-md border border-gray-200 p-4 relative overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 animate-shimmer z-10 pointer-events-none"></div>

      <div className="mb-3 flex items-center justify-between">
        <div className="h-6 w-32 skeleton-bg rounded-sm"></div>
        <div className="h-7 w-7 skeleton-bg rounded-sm"></div>
      </div>
      <div className="space-y-2">
        <div className="h-9 w-full skeleton-bg rounded-sm"></div>
        <div className="h-9 w-full skeleton-bg rounded-sm"></div>
      </div>
    </div>
  )
}

export function CredentialsSkeleton() {
  return (
    <div className="mb-4 rounded-md border border-gray-200 p-4 relative overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 animate-shimmer z-10 pointer-events-none"></div>

      <div className="mb-3 flex items-center justify-between">
        <div className="h-6 w-32 skeleton-bg rounded-sm"></div>
        <div className="h-7 w-7 skeleton-bg rounded-sm"></div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-sm skeleton-bg p-3 h-16"></div>
        ))}
      </div>
    </div>
  )
}

export function AllTimeSkeleton() {
  return (
    <div className="rounded-md border border-gray-200 p-4 relative overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 animate-shimmer z-10 pointer-events-none"></div>

      <div className="h-6 w-24 skeleton-bg rounded-sm mb-4"></div>
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 skeleton-bg rounded-sm"></div>
              <div className="h-4 w-24 skeleton-bg rounded-sm"></div>
            </div>
            <div className="h-4 w-8 skeleton-bg rounded-sm"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProfileSectionSkeleton() {
  return (
    <div className="mb-4 rounded-md border border-gray-200 p-4 relative overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 animate-shimmer z-10 pointer-events-none"></div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 skeleton-bg rounded-full"></div>
          <div className="h-6 w-32 skeleton-bg rounded-sm"></div>
        </div>
        <div className="h-7 w-7 skeleton-bg rounded-sm"></div>
      </div>
    </div>
  )
}
