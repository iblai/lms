import { Star } from 'lucide-react';

export const SkeletonSkillBox = () => {
  return (
    <div className="flex w-[200px] flex-shrink-0 animate-pulse flex-col items-center rounded-lg border border-gray-200 p-6">
      <div className="mb-2">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
      </div>
      <div className="mb-4 h-4 w-20 rounded bg-gray-200" />
      <div className="relative mb-4 h-20 w-20">
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-gray-200" />
        </div>
      </div>
      <Star className="h-6 w-6 text-gray-200" />
    </div>
  );
};
