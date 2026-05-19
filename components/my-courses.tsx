'use client';

import { ChevronRight } from 'lucide-react';
import { CourseCardSkeleton } from './course-card-skeleton';
import { useUserCourses } from '@/hooks/courses/use-user-courses';
import { SkeletonMultiplier } from './skeleton-multiplier';
import { DefaultEmptyBox } from './default-empty-box';
import { CourseBox } from './course-box';
import Link from 'next/link';
import { useTenantParam } from '@/hooks/use-tenant-param';
export function MyCourses() {
  const tenant = useTenantParam();
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
          <h3 className="text-base font-semibold text-gray-600 sm:text-lg md:text-xl">
            My Courses
          </h3>
          <Link
            href={`/${tenant}/profile/courses`}
            className="flex items-center gap-1 rounded-md px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 sm:text-sm"
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
      <section
        aria-label="My Courses"
        className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      >
        {loading && <SkeletonMultiplier multiplier={8} Skeleton={CourseCardSkeleton} />}
        {!loading &&
          !errorUserCourses &&
          courses.length > 0 &&
          courses.map((course, index) => (
            <CourseBox key={`enrolled-course-${course.course_id}-${index}`} course={course} />
          ))}
      </section>
    </div>
  );
}
