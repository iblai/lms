import { CourseCardSkeleton } from "@/components/course-card-skeleton"

export default function RecommendedLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-white p-6 space-y-8">
      <div className="h-10 w-64 bg-gray-200 rounded-md animate-pulse"></div>

      <div className="w-full max-w-md h-12 bg-gray-200 rounded-md animate-pulse mb-8"></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
