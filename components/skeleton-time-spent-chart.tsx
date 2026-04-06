import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonTimeSpentChart() {
  return (
    <div className="mb-6 rounded-md border border-amber-100 bg-amber-50/30 p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-medium text-gray-700">
        <Skeleton className="h-6 w-32" />
      </h2>
      <div className="rounded-lg border border-amber-200 bg-white p-4">
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
