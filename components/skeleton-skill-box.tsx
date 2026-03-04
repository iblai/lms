import { Star } from "lucide-react"

export const SkeletonSkillBox = () => {
  return (
    <div className="border border-gray-200 rounded-lg p-6 flex flex-col items-center w-[200px] flex-shrink-0 animate-pulse">
      <div className="mb-2">
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
      </div>
      <div className="h-4 w-20 bg-gray-200 rounded mb-4" />
      <div className="relative w-20 h-20 mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
        </div>
      </div>
      <Star className="h-6 w-6 text-gray-200" />
    </div>
  )
}
