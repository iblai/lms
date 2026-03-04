export const SkeletonPathwayBox = () => {
  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden bg-white animate-pulse h-[200px]"
    >
      <div className="h-32 bg-gray-200"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-2 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );
};
