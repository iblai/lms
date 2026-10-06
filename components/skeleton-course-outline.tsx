import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonCourseOutline() {
  return (
    <div className="border-b border-gray-200">
      <div className="flex w-full items-start gap-3 px-4 py-3">
        <Skeleton className="mt-0.5 h-5 w-5 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="mt-1 h-4 w-4" />
      </div>
    </div>
  );
}
