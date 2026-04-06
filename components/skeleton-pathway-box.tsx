export const SkeletonPathwayBox = () => {
  return (
    <div className="h-[200px] animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="h-32 bg-gray-200"></div>
      <div className="p-4">
        <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
        <div className="mb-1 h-2 w-full rounded bg-gray-200"></div>
        <div className="h-2 w-1/4 rounded bg-gray-200"></div>
      </div>
    </div>
  );
};
