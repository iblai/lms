import { Skeleton } from "@/components/ui/skeleton"

export default function CredentialsLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-8">
      <Skeleton className="h-10 w-48" />

      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-[120px] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
