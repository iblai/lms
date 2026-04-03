import React from 'react';

export const SkeletonCreatePathwaySearchList = () => {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-gray-200">
      <div className="flex items-center bg-white p-3">
        {/* Image skeleton */}
        <div className="relative mr-3 h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gray-200">
          <div className="h-full w-full animate-pulse bg-gray-300" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1">
          <div className="mb-2 h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
        </div>

        {/* Button skeleton */}
        <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200" />
      </div>
    </div>
  );
};

export default SkeletonCreatePathwaySearchList;
