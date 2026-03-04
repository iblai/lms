import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCourseSyllabus() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((sectionIndex) => (
        <div
          key={sectionIndex}
          className="border border-gray-200 rounded-md overflow-hidden"
        >
          <div className="flex justify-between items-center p-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
