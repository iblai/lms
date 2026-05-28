import { CourseCardSkeleton } from '@/components/course-card-skeleton';

export default function RecommendedLoading() {
  return (
    <div className="flex min-h-screen flex-col space-y-8 bg-white p-6">
      <div className="h-10 w-64 animate-pulse rounded-md bg-gray-200"></div>

      <div className="mb-8 h-12 w-full max-w-md animate-pulse rounded-md bg-gray-200"></div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
