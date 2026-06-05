import { Skeleton } from '@/components/ui/skeleton';

export default function CredentialsLoading() {
  return (
    <div className="flex min-h-screen flex-col space-y-8 bg-gray-50 p-6">
      <Skeleton className="h-10 w-48" />

      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-[120px] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
