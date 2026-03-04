export const SkeletonAddSkillsLoading = () => {
  return (
    <div className="flex items-center p-3 border border-gray-200 rounded-md">
      <div className="flex-1">
        <div className="flex items-center">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>
      <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
    </div>
  )
}