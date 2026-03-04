import { Skeleton } from "@/components/ui/skeleton"

export default function ProgramsLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-8">
      <Skeleton className="h-10 w-48" />

      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  )
}
