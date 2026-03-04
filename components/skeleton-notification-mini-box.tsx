import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonNotificationMiniBox() {
  return (
    <div className="flex">
      <div className="flex-shrink-0 mr-3">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
