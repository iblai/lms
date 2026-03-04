import React from 'react';

export const SkeletonCreatePathwaySearchList = () => {
  return (
    <div
          className="border border-gray-200 rounded-lg overflow-hidden animate-pulse"
        >
          <div className="flex items-center p-3 bg-white">
            {/* Image skeleton */}
            <div className="w-12 h-12 relative flex-shrink-0 mr-3 rounded-md overflow-hidden bg-gray-200">
              <div className="w-full h-full bg-gray-300 animate-pulse" />
            </div>
            
            {/* Content skeleton */}
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" />
            </div>
            
            {/* Button skeleton */}
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
  );
};

export default SkeletonCreatePathwaySearchList;
