import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonEducationBox() {
  return (
    <div>
      <div className="flex items-center">
        <Skeleton className="h-5 w-24" /> {/* Pour le titre B. Tech */}
        <Skeleton className="ml-2 h-4 w-4" /> {/* Pour le bouton d'édition */}
      </div>
      <div className="mt-1">
        <Skeleton className="h-4 w-48" /> {/* Pour Harvard | 2025 - Present | */}
      </div>
      <div className="mt-2">
        <Skeleton className="h-4 w-32" /> {/* Pour le texte de description */}
      </div>
    </div>
  );
}
