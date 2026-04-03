import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header skeleton */}
      <div className="h-16 flex-shrink-0 border-b border-gray-200 bg-white md:h-20"></div>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar skeleton */}
        <div className="w-full border-r border-gray-200 md:w-72">
          <div className="border-b border-gray-200 p-4">
            <Skeleton className="h-6 w-48" />
          </div>

          <div className="space-y-4 p-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  {i === 0 && (
                    <div className="space-y-2 pl-4">
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex flex-1 flex-col">
          {/* Tabs skeleton */}
          <div className="border-b border-gray-200">
            <div className="flex p-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="mx-2 h-4 w-16" />
                ))}
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4">
              <div className="flex items-center">
                <Skeleton className="mr-2 h-3 w-24" />
                <Skeleton className="mx-1 h-3 w-3" />
                <Skeleton className="mr-2 h-3 w-32" />
                <Skeleton className="mx-1 h-3 w-3" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex items-center">
                <Skeleton className="mr-4 h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="h-full bg-amber-50 p-6">
            <div className="mx-auto max-w-4xl">
              <Skeleton className="mb-4 h-8 w-64" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-6 h-4 w-5/6" />

              <div className="mb-6 aspect-video rounded-md bg-gray-200"></div>

              <div className="mb-6 rounded-md border border-gray-200 bg-white p-4">
                <Skeleton className="mb-2 h-5 w-40" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
