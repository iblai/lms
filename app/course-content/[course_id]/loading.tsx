import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header skeleton */}
      <div className="h-16 md:h-20 border-b border-gray-200 flex-shrink-0 bg-white"></div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar skeleton */}
        <div className="w-full md:w-72 border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <Skeleton className="h-6 w-48" />
          </div>

          <div className="p-4 space-y-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  {i === 0 && (
                    <div className="pl-4 space-y-2">
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Tabs skeleton */}
          <div className="border-b border-gray-200">
            <div className="flex p-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-4 w-16 mx-2" />
                ))}
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50">
              <div className="flex items-center">
                <Skeleton className="h-3 w-24 mr-2" />
                <Skeleton className="h-3 w-3 mx-1" />
                <Skeleton className="h-3 w-32 mr-2" />
                <Skeleton className="h-3 w-3 mx-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex items-center">
                <Skeleton className="h-3 w-16 mr-4" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="p-6 h-full bg-amber-50">
            <div className="max-w-4xl mx-auto">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-6" />

              <div className="bg-gray-200 aspect-video rounded-md mb-6"></div>

              <div className="bg-white p-4 rounded-md border border-gray-200 mb-6">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
