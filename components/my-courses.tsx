'use client';

import { ChevronRight } from 'lucide-react';
import { CourseCardSkeleton } from './course-card-skeleton';
import { useUserCourses } from '@/hooks/courses/use-user-courses';
import { SkeletonMultiplier } from './skeleton-multiplier';
import { DefaultEmptyBox } from './default-empty-box';
import { CourseBox } from './course-box';
import Link from 'next/link';
export function MyCourses() {
  const {
    userCourses: courses,
    isLoadingUserCourses: loading,
    errorUserCourses,
  } = useUserCourses({
    limit: 8,
    courseType: 'enrolled',
  });

  return (
    <div className="mb-6 w-full">
      <div className="mb-4">
        {/* <h2 className="text-sm sm:text-base font-medium text-gray-600">My Courses</h2> */}
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-600">
            My Courses
          </h3>
          <Link
            href="/profile/courses"
            className="rounded-md px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1"
          >
            See More
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {((!loading && errorUserCourses) ||
        (!loading && !errorUserCourses && courses.length === 0)) && (
        <DefaultEmptyBox message="You have not enrolled in any courses yet." />
      )}
      <div
        aria-label="My Courses Grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 w-full"
      >
        {loading && <SkeletonMultiplier multiplier={8} Skeleton={CourseCardSkeleton} />}
        {!loading &&
          !errorUserCourses &&
          courses.length > 0 &&
          courses.map((course, index) => (
            <CourseBox key={`enrolled-course-${course.course_id}-${index}`} course={course} />
          ))}
      </div>
    </div>
  );
}
