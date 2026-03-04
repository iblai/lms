import Image from "next/image"
import Link from "next/link"

interface CourseCardProps {
  course: {
    id: number
    title: string
    image: string
    duration: string
    completed: boolean,
    course_id: string
  }
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.course_id}`} className="block h-full">
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white transition-transform duration-500 ease-in-out hover:scale-105 flex flex-col h-full w-full cursor-pointer shadow-sm">
        <div className="relative aspect-video w-full overflow-hidden">
          <Image src={course.image || "/placeholder.svg"} alt={course.title} fill className="object-cover" />
          <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-sm">course</div>
        </div>
        <div className="flex flex-col flex-1 p-4 pb-6 justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 h-10">{course.title}</h3>
          </div>
        </div>
      </div>
    </Link>
  )
}
