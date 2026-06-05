import { Skeleton } from '@/components/ui/skeleton';

export default function PublicProfileLoading() {
  return (
    <div className="flex min-h-screen flex-col space-y-8 bg-gray-50 p-6">
      <Skeleton className="h-10 w-48" />

      <div className="space-y-4">
        {/* Banner skeleton */}
        <Skeleton className="h-48 w-full rounded-lg" />

        {/* Profile info skeleton */}
        <div className="pt-16">
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="mb-4 h-4 w-48" />
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
  );
}
