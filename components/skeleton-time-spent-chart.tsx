import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonTimeSpentChart() {
  return (
    <div className="mb-6 bg-amber-50/30 rounded-md p-6 border border-amber-100 shadow-sm">
      <h2 className="text-lg font-medium text-gray-700 mb-4">
        <Skeleton className="h-6 w-32" />
      </h2>
      <div className="bg-white rounded-lg border border-amber-200 p-4">
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
