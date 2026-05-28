import { Skeleton } from '@/components/ui/skeleton';

export default function DiscoverLoading() {
  return (
    <div className="flex min-h-screen flex-col space-y-8 bg-gray-50 p-6">
      <Skeleton className="h-10 w-48" />

      <div className="flex space-x-6">
        {/* Sidebar skeleton */}
        <div className="hidden w-64 space-y-6 md:block">
          <Skeleton className="h-8 w-40" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
