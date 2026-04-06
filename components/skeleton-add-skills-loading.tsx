export const SkeletonAddSkillsLoading = () => {
  return (
    <div className="flex items-center rounded-md border border-gray-200 p-3">
      <div className="flex-1">
        <div className="flex items-center">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
        </div>
      </div>
      <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200"></div>
    </div>
  );
};
