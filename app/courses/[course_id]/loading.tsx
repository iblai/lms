import { Skeleton } from '@/components/ui/skeleton';

export default function CourseDetailsLoading() {
  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Main content area with tabs and chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Course Title */}
          <div className="border-b border-gray-200 p-6">
            <Skeleton className="h-8 w-2/3" />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="px-6">
              <div className="flex space-x-8 py-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <div className="grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="sticky top-6 space-y-6">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-md" />
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="space-y-6">
                  <div>
                    <Skeleton className="mb-3 h-6 w-48" />
                    <Skeleton className="mb-2 h-4 w-full" />
                    <Skeleton className="mb-2 h-4 w-full" />
                    <Skeleton className="mb-2 h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>

                  <div>
                    <Skeleton className="mb-3 h-6 w-48" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
