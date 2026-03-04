export const CredentialMiniBoxSkeleton = () => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white animate-pulse flex items-start">
      <div className="w-12 h-12 bg-gray-200 rounded-full mr-4 flex-shrink-0"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );
};
