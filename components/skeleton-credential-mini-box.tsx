export const CredentialMiniBoxSkeleton = () => {
  return (
    <div className="flex animate-pulse items-start rounded-lg border border-gray-200 bg-white p-4">
      <div className="mr-4 h-12 w-12 flex-shrink-0 rounded-full bg-gray-200"></div>
      <div className="flex-1">
        <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
        <div className="mb-2 h-3 w-1/2 rounded bg-gray-200"></div>
        <div className="h-3 w-2/3 rounded bg-gray-200"></div>
      </div>
    </div>
  );
};
