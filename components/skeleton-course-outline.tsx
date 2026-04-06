import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonCourseOutline() {
  return (
    <div className="border-b border-gray-200">
      <div className="flex w-full items-center justify-between p-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  );
}
