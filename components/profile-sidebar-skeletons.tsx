export function SkillsSkeleton() {
  return (
    <div className="relative mb-4 overflow-hidden rounded-md border border-gray-200 p-4">
      {/* Shimmer overlay */}
      <div className="animate-shimmer pointer-events-none absolute inset-0 z-10"></div>

      <div className="mb-3 flex items-center justify-between">
        <div className="skeleton-bg h-6 w-32 rounded-sm"></div>
        <div className="skeleton-bg h-7 w-7 rounded-sm"></div>
      </div>
      <div className="space-y-2">
        <div className="skeleton-bg h-9 w-full rounded-sm"></div>
        <div className="skeleton-bg h-9 w-full rounded-sm"></div>
      </div>
    </div>
  );
}

export function CredentialsSkeleton() {
  return (
    <div className="relative mb-4 overflow-hidden rounded-md border border-gray-200 p-4">
      {/* Shimmer overlay */}
      <div className="animate-shimmer pointer-events-none absolute inset-0 z-10"></div>

      <div className="mb-3 flex items-center justify-between">
        <div className="skeleton-bg h-6 w-32 rounded-sm"></div>
        <div className="skeleton-bg h-7 w-7 rounded-sm"></div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton-bg h-16 rounded-sm p-3"></div>
        ))}
      </div>
    </div>
  );
}

export function AllTimeSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-md border border-gray-200 p-4">
      {/* Shimmer overlay */}
      <div className="animate-shimmer pointer-events-none absolute inset-0 z-10"></div>

      <div className="skeleton-bg mb-4 h-6 w-24 rounded-sm"></div>
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="skeleton-bg h-5 w-5 rounded-sm"></div>
              <div className="skeleton-bg h-4 w-24 rounded-sm"></div>
            </div>
            <div className="skeleton-bg h-4 w-8 rounded-sm"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSectionSkeleton() {
  return (
    <div className="relative mb-4 overflow-hidden rounded-md border border-gray-200 p-4">
      {/* Shimmer overlay */}
      <div className="animate-shimmer pointer-events-none absolute inset-0 z-10"></div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="skeleton-bg h-12 w-12 rounded-full"></div>
          <div className="skeleton-bg h-6 w-32 rounded-sm"></div>
        </div>
        <div className="skeleton-bg h-7 w-7 rounded-sm"></div>
      </div>
    </div>
  );
}
