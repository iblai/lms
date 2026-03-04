export const SkeletonActivityStatBox = () => {
  return (
    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
    </div>
  )
}