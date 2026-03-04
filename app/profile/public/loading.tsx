import { Skeleton } from "@/components/ui/skeleton"

export default function PublicProfileLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-8">
      <Skeleton className="h-10 w-48" />

      <div className="space-y-4">
        {/* Banner skeleton */}
        <Skeleton className="h-48 w-full rounded-lg" />

        {/* Profile info skeleton */}
        <div className="pt-16">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48 mb-4" />
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex space-x-4 overflow-x-auto py-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>

        {/* Content skeleton */}
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}
