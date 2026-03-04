import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonProfileInfoCard() {
  return (
    <div className="border border-[var(--border)] rounded-sm p-4 flex items-start">
        <Skeleton className="w-12 h-12 rounded-sm mr-4" />
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
  );
}
