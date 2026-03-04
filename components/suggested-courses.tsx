'use client';

import { ChevronRight } from 'lucide-react';
import { CourseCardSkeleton } from './course-card-skeleton';
import { useRecommendedCourses } from '@/hooks/courses/use-recommended-courses';
import Link from 'next/link';
import { DefaultEmptyBox } from './default-empty-box';
import { SkeletonMultiplier } from './skeleton-multiplier';
import { CourseBox } from './course-box';
import { getTenant } from '@/utils/helpers';
export function SuggestedCourses() {
  const {
    recommendedCourses: courses,
    isLoading: loading,
    isError,
  } = useRecommendedCourses({
    limit: 8,
    forceLimit: true,
    tenant: getTenant(),
  });

  return (
    <div className="mb-6 w-full">
      <div className="mb-4">
        {/* <h2 className="text-sm sm:text-base font-medium text-gray-600">
          Suggested Courses Based on Your Profile
        </h2> */}
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-600">
            Suggested Courses
          </h3>
          <Link
            href="/recommended"
            className="rounded-md px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1"
          >
            See More
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {((!loading && isError) || (!loading && !isError && courses.length === 0)) && (
        <DefaultEmptyBox message="No suggested courses found." />
      )}
      <div className="grid grid-cols-1 min-[450px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 w-full overflow-hidden">
        {loading && <SkeletonMultiplier multiplier={8} Skeleton={CourseCardSkeleton} />}
        {!loading &&
          !isError &&
          courses.length > 0 &&
          courses.map((course, index) => (
            <CourseBox
              key={`recommended-course-${course.data.course_id}-${index}`}
              course={course.data}
            />
          ))}
      </div>
    </div>
  );
}
