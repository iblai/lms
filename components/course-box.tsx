import Image from "next/image";
import { Course } from "@/types/courses";
import { config } from "@/lib/config";
import { getRandomCourseImage } from "@/utils/helpers";
import Link from "next/link";
export const CourseBox = ({ course }: { course: Course }) => {
  const getCourseImage = (course: Course) => {
    if (course.edx_data?.course_image_asset_path) {
      return config.urls.lms() + course.edx_data?.course_image_asset_path;
    }
    return getRandomCourseImage();
  };
  return (
    <Link
      href={`/courses/${course.course_id}`}
      key={course.course_id}
      className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-transform duration-500 ease-in-out hover:scale-105 flex flex-col h-full w-full cursor-pointer shadow-sm"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={getCourseImage(course)}
          alt={course.name}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getRandomCourseImage();
          }}
          priority
        />
        <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
          course
        </div>
      </div>
      <div className="flex flex-col flex-1 p-4 justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 h-10">
            {course.name}
          </h3>
        </div>
      </div>
    </Link>
  );
};
