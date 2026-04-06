import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonNotificationMiniBox() {
  return (
    <div className="flex">
      <div className="mr-3 flex-shrink-0">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex-1">
        <Skeleton className="mb-2 h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
