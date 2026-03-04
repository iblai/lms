import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCourseOutline() {
  return (
    <div className="border-b border-gray-200">
      <div className="w-full p-3 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  );
}
