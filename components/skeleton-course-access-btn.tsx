import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCourseAccessBtn() {
  return (
    <Skeleton className="w-full h-[44px] rounded-md bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
  );
}
