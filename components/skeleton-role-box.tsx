export function SkeletonRoleBox() {
  return (
    <div
      className={"border rounded-lg p-3 sm:p-4 border-gray-200 animate-pulse"}
    >
      <div className="flex items-start">
        <div className="mr-2 mt-1">
          <div className="h-4 w-4 rounded-full bg-gray-200" />
        </div>
        <div className="flex-1">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded mt-2" />
        </div>
      </div>
    </div>
  );
}
