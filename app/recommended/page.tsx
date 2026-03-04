'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useRecommendedCourses } from '@/hooks/courses/use-recommended-courses';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { CourseCardSkeleton } from '@/components/course-card-skeleton';
import { RecommendedCourseResult } from '@/types/courses';
import { CourseBox } from '@/components/course-box';
import { getTenant } from '@/utils/helpers';

export default function RecommendedPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { recommendedCourses, isLoading, isError } = useRecommendedCourses({
    limit: 8,
    search: searchQuery,
    tenant: getTenant(),
  });

  return (
    <>
      <main
        className="h-[calc(100vh-80px)] overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="flex flex-col md:flex-row items-start h-full">
          <div
            className="flex flex-col gap-6 flex-1 h-full overflow-y-auto w-full px-6 py-6 pb-16 md:pb-6"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx>{`
              main::-webkit-scrollbar {
                display: none;
              }
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-600 mb-6">
                Recommended for Me
              </h1>

              <div className="flex justify-between items-center mb-6">
                <div className="relative w-64">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <button className="flex items-center gap-2 bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] px-4 py-2 rounded-md hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity">
                  <Plus className="h-4 w-4" />
                  <span>Recommended Courses</span>
                </button>
              </div>
              {((!isLoading && isError) || (!isLoading && recommendedCourses.length === 0)) && (
                <DefaultEmptyBox message="No courses found." className="w-full" />
              )}

              {/* Course Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-10">
                {isLoading && <SkeletonMultiplier Skeleton={CourseCardSkeleton} multiplier={6} />}
                {!isLoading &&
                  !isError &&
                  recommendedCourses.map((course: RecommendedCourseResult, index: number) => (
                    <CourseBox
                      key={`course-${course.data.course_id}-${index}`}
                      course={course.data}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
