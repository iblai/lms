import Image from 'next/image';
import Link from 'next/link';

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    image: string;
    duration: string;
    completed: boolean;
    course_id: string;
  };
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.course_id}`} className="block h-full">
      <div className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition-transform duration-500 ease-in-out hover:scale-105">
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={course.image || '/placeholder.svg'}
            alt={course.title}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-2 left-2 rounded-sm bg-amber-500 px-2 py-1 text-xs text-white">
            course
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between p-4 pb-6">
          <div>
            <h3 className="line-clamp-2 h-10 text-xs font-medium text-gray-900 sm:text-sm">
              {course.title}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
}
