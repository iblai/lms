import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonCourseAccessBtn() {
  return (
    <Skeleton className="h-[44px] w-full animate-pulse rounded-md bg-gradient-to-r from-gray-200 to-gray-300" />
  );
}
