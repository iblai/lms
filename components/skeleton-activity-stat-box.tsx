export const SkeletonActivityStatBox = () => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50 p-3 transition-shadow hover:shadow-sm">
      <div className="mb-1 h-6 w-12 animate-pulse rounded bg-gray-200"></div>
      <div className="h-3 w-16 animate-pulse rounded bg-gray-200"></div>
    </div>
  );
};
