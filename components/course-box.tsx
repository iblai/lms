import Image from 'next/image';
import { Course } from '@/types/courses';
import { config } from '@/lib/config';
import { getRandomCourseImage } from '@/utils/helpers';
import Link from 'next/link';
import { useTenantParam } from '@/hooks/use-tenant-param';
export const CourseBox = ({ course }: { course: Course }) => {
  const tenant = useTenantParam();
  const getCourseImage = (course: Course) => {
    if (course.edx_data?.course_image_asset_path) {
      return config.urls.lms() + course.edx_data?.course_image_asset_path;
    }
    return getRandomCourseImage();
  };
  return (
    <Link
      href={`/${tenant}/courses/${course.course_id}`}
      key={course.course_id}
      className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-transform duration-500 ease-in-out hover:scale-105"
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
        <div className="absolute bottom-2 left-2 rounded bg-amber-500 px-2 py-1 text-xs text-white">
          course
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="line-clamp-2 h-10 text-xs font-medium text-gray-900 sm:text-sm">
            {course.name}
          </h3>
        </div>
      </div>
    </Link>
  );
};
