import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonProfileInfoCard() {
  return (
    <div className="flex items-start rounded-sm border border-[var(--border)] p-4">
      <Skeleton className="mr-4 h-12 w-12 rounded-sm" />
      <div>
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-5 w-32" />
      </div>
    </div>
  );
}
