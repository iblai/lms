import { Skeleton } from '@/components/ui/skeleton';

export default function ProgramsLoading() {
  return (
    <div className="flex min-h-screen flex-col space-y-8 bg-gray-50 p-6">
      <Skeleton className="h-10 w-48" />

      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
