export function SkeletonRoleBox() {
  return (
    <div className={'animate-pulse rounded-lg border border-gray-200 p-3 sm:p-4'}>
      <div className="flex items-start">
        <div className="mt-1 mr-2">
          <div className="h-4 w-4 rounded-full bg-gray-200" />
        </div>
        <div className="flex-1">
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-full rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
