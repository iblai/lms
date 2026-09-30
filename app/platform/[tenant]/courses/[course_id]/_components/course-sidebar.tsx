import Image from 'next/image';
import { Clock, Calendar, Globe, DollarSign } from 'lucide-react';
import dayjs from 'dayjs';
import type { CourseServerData } from '@/lib/utils/seo-data';
import { CourseCta } from './course-cta';

/**
 * Server-rendered course sidebar: image + facts (price/language/duration/date)
 * emitted in the initial HTML, with the interactive enroll/access CTA as a
 * client island in between.
 */
export function CourseSidebar({ course }: { course: CourseServerData }) {
  const startDate = course.startDate ? dayjs(course.startDate) : null;

  return (
    <div className="sticky space-y-6">
      {course.image && (
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
          <Image src={course.image} alt={course.title} fill className="object-cover" />
        </div>
      )}

      <CourseCta />

      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        {course.price && (
          <div className="flex items-center text-gray-600">
            <DollarSign className="mr-3 h-5 w-5 text-amber-500" />
            <span>{course.price}</span>
          </div>
        )}
        {course.language && (
          <div className="flex items-center text-gray-600">
            <Globe className="mr-3 h-5 w-5 text-amber-500" />
            <span>{course.language}</span>
          </div>
        )}
        {course.duration && (
          <div className="flex items-center text-gray-600">
            <Clock className="mr-3 h-5 w-5 text-amber-500" />
            <span>{course.duration}</span>
          </div>
        )}
        {startDate?.isValid() && (
          <div className="flex items-center text-gray-600">
            <Calendar className="mr-3 h-5 w-5 text-amber-500" />
            <span>{startDate.format('MMM D, YYYY')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
